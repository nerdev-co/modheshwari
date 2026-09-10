import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import getRedisClient from "@modheshwari/redis";
import { z } from "zod";

import { requireAuth } from "../authMiddleware";
import { validateBody } from "../../lib/validate";

const CreateConversationSchema = z.object({
  participantIds: z
    .array(z.string())
    .min(1, "participantIds must be a non-empty array")
    .max(50, "Too many participants (max 50)"),
});

const CONVERSATIONS_TTL = Number(process.env.CONVERSATIONS_TTL_SECONDS || 30);

/**
 * Performs conversations cache key operation.
 * @param {string} userId - Description of userId
 * @returns {string} Description of return value
 */
function conversationsCacheKey(userId: string): string {
    return `user:conversations:${userId}`;
}

/**
 * GET /api/messages/conversations
 * Get all conversations for the current user
 */
export async function handleGetConversations(req: Request): Promise<Response> {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response;
    const userId = auth.payload.userId as string;

    try {
        const redis = await getRedisClient();
        const cacheKey = conversationsCacheKey(userId);
        const cached = await redis.get(cacheKey);

        let conversationsWithDetails;

        if (cached) {
            conversationsWithDetails = JSON.parse(cached);
        } else {
            const conversations = await prisma.conversation.findMany({
                where: {
                    participants: {
                        has: userId,
                    },
                },
                orderBy: {
                    lastMessageAt: "desc",
                },
                include: {
                    messages: {
                        take: 1,
                        orderBy: {
                            createdAt: "desc",
                        },
                    },
                },
            });

            // Get participant details — batch all participant IDs into a single query
            const allOtherIds = new Set<string>();
            for (const conv of conversations) {
                for (const pid of conv.participants) {
                    if (pid !== userId) allOtherIds.add(pid);
                }
            }

            const participantUsers =
                allOtherIds.size > 0
                    ? await prisma.user.findMany({
                          where: { id: { in: [...allOtherIds] } },
                          select: {
                              id: true,
                              name: true,
                              profile: {
                                  select: {
                                      profession: true,
                                      location: true,
                                  },
                              },
                          },
                      })
                    : [];

            const participantMap = new Map(
                participantUsers.map((u) => [u.id, u]),
            );

            // Batch unread counts — single query with groupBy
            const unreadCounts = await prisma.message.groupBy({
                by: ["conversationId"],
                where: {
                    conversationId: { in: conversations.map((c) => c.id) },
                    senderId: { not: userId },
                    NOT: { readBy: { has: userId } },
                },
                _count: true,
            });

            const unreadMap = new Map(
                unreadCounts.map((u) => [u.conversationId, u._count]),
            );

            conversationsWithDetails = conversations.map((conv) => {
                const otherParticipantIds = conv.participants.filter(
                    (id: string) => id !== userId,
                );
                return {
                    id: conv.id,
                    lastMessageAt: conv.lastMessageAt,
                    lastMessage: (conv as any).lastMessage,
                    participants: otherParticipantIds.flatMap((pid: string) => {
                        const p = participantMap.get(pid);
                        return p ? [p] : [];
                    }),
                    unreadCount: unreadMap.get(conv.id) ?? 0,
                    latestMessage: conv.messages[0] ?? null,
                };
            });

            await redis.set(
                cacheKey,
                JSON.stringify(conversationsWithDetails),
                {
                    EX: CONVERSATIONS_TTL,
                },
            );
        }

        return success("Conversations retrieved", conversationsWithDetails);
    } catch {
        return failure("Failed to fetch conversations", null, 500);
    }
}

/**
 * POST /api/messages/conversations
 * Create or get existing conversation
 */
export async function handleCreateConversation(
    req: Request,
): Promise<Response> {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response;
    const userId = auth.payload.userId as string;

    try {
        const v = await validateBody(req, CreateConversationSchema);
        if (!v.ok) return v.response;
        const body = v.data;

        // Add current user to participants
        const allParticipants = Array.from(
            new Set([userId, ...body.participantIds]),
        );

        // Check if conversation already exists
        const existingConversation = await prisma.conversation.findFirst({
            where: {
                AND: [
                    {
                        participants: {
                            hasEvery: allParticipants,
                        },
                    },
                    {
                        participants: {
                            isEmpty: false,
                        },
                    },
                ],
            },
        });

        if (existingConversation) {
            return success("Conversation found", existingConversation);
        }

        // Create new conversation
        const conversation = await prisma.conversation.create({
            data: {
                participants: allParticipants,
            },
        });

        // Invalidate conversations cache for all participants
        try {
            const redis = await getRedisClient();
            for (const pid of allParticipants) {
                await redis.del(conversationsCacheKey(pid));
            }
        } catch {
            // Cache invalidation failure is non-critical
        }

        return success("Conversation created", conversation, 201);
    } catch (err: any) {
        return failure(
            "Failed to create conversation",
            err.message || null,
            500,
        );
    }
}
