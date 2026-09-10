import { randomUUID } from "crypto";

import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";
import { Role, NotificationType, NotificationChannel } from "@prisma/client";
import getRedisClient from "@modheshwari/redis";
import { z } from "zod";

import { requireAuth } from "./authMiddleware";
import { TOPICS } from "../kafka/config";
import { createOutboxEvent } from "../lib/outbox";
import { logger } from "../lib/logger";
import { validateBody } from "../lib/validate";
import {
    NotificationChannelSchema,
    RoleSchema,
    PrioritySchema,
} from "../lib/sharedSchemas";

const NotificationTypeSchema = z.enum([
    "EVENT_APPROVAL",
    "EVENT_REGISTRATION",
    "RESOURCE_REQUEST",
    "PAYMENT_RECEIPT",
    "GENERIC",
    "STATUS_UPDATE_REQUEST",
]);

const CreateNotificationSchema = z.object({
    message: z.string().min(1, "Message is required"),
    type: NotificationTypeSchema.optional().default("GENERIC"),
    channels: z.array(NotificationChannelSchema).optional().default(["IN_APP"]),
    targetRole: RoleSchema.optional(),
    subject: z.string().optional(),
    priority: PrioritySchema.optional().default("normal"),
});

/**
 * Broadcast a notification to users based on sender's role and scope
 * POST /api/notifications
 * Body: { message: string, type?: string, channels?: string[], targetRole?: Role, subject?: string, priority?: string }
 */
export async function handleCreateNotification(req: Request) {
    try {
        const auth = requireAuth(req, [
            "COMMUNITY_HEAD",
            "COMMUNITY_SUBHEAD",
            "GOTRA_HEAD",
            "FAMILY_HEAD",
        ]);

        if (!auth.ok) return auth.response as Response;

        const v = await validateBody(req, CreateNotificationSchema);
        if (!v.ok) return v.response;
        const body = v.data;

        const {
            message,
            type = NotificationType.GENERIC,
            channels = [NotificationChannel.IN_APP],
            targetRole,
            subject,
            priority = "normal",
        } = body;

        const senderId = auth.payload.userId;
        const senderRole = auth.payload.role as Role;

        /**
         * Permission matrix:
         * - COMMUNITY_HEAD        → everyone
         * - COMMUNITY_SUBHEAD     → admins only
         * - GOTRA_HEAD            → own gotra
         * - FAMILY_HEAD           → own family
         */
        const ROLE_TARGETS: Record<Role, Role[]> = {
            COMMUNITY_HEAD: [
                "COMMUNITY_HEAD",
                "COMMUNITY_SUBHEAD",
                "GOTRA_HEAD",
                "FAMILY_HEAD",
                "MEMBER",
            ],
            COMMUNITY_SUBHEAD: [
                "COMMUNITY_HEAD",
                "COMMUNITY_SUBHEAD",
                "GOTRA_HEAD",
            ],
            GOTRA_HEAD: ["FAMILY_HEAD", "MEMBER"],
            FAMILY_HEAD: ["MEMBER"],
            MEMBER: [],
        };

        // Validate targetRole if provided
        if (targetRole) {
            const allowed = ROLE_TARGETS[senderRole] || [];
            if (!allowed.includes(targetRole)) {
                return failure("Invalid target role", "Forbidden", 403);
            }
        }

        /**
         * Base user filter
         */
        const where: any = {
            status: true,
        };

        /**
         * Apply role-based scoping
         */
        switch (senderRole) {
            case "FAMILY_HEAD": {
                // Restrict to sender's family
                const family = await prisma.familyMember.findFirst({
                    where: { userId: senderId, role: "FAMILY_HEAD" },
                    select: { familyId: true },
                });

                if (!family) {
                    return failure("Family not found", "Invalid State", 400);
                }

                where.families = {
                    some: { familyId: family.familyId },
                };
                break;
            }

            case "GOTRA_HEAD": {
                // Restrict to sender's gotra
                const profile = await prisma.profile.findUnique({
                    where: { userId: senderId },
                    select: { gotra: true },
                });

                if (!profile?.gotra) {
                    return failure("Gotra not found", "Invalid State", 400);
                }

                where.profile = {
                    gotra: profile.gotra,
                };
                break;
            }

            case "COMMUNITY_SUBHEAD": {
                // Admins only
                where.role = {
                    in: ["COMMUNITY_HEAD", "COMMUNITY_SUBHEAD", "GOTRA_HEAD"],
                };
                break;
            }

            case "COMMUNITY_HEAD":
                // No restriction (full broadcast)
                break;
        }

        /**
         * Optional role filter (after scope)
         */
        if (targetRole) {
            where.role = targetRole;
        }

        /**
         * Fetch recipients
         */
        const users = await prisma.user.findMany({
            where,
            select: { id: true },
        });

        if (!users.length) {
            return failure("No users found for broadcast", "Not Found", 404);
        }

        const eventId = randomUUID();
        const timestamp = new Date().toISOString();

        let deliveryStrategy: "BROADCAST" | "ESCALATION" = "BROADCAST";
        const notificationPriority = priority || "MEDIUM";
        if (notificationPriority === "CRITICAL") {
            deliveryStrategy = "BROADCAST";
        }

        const recipientIds = users.map((u) => u.id);

        const payload = {
            eventId,
            message,
            type,
            channels,
            subject: subject ?? null,
            recipientIds,
            senderId,
            priority,
            timestamp,
            deliveryStrategy,
            notificationPriority,
        };

        await prisma.$transaction(async (tx) => {
            await createOutboxEvent(tx, {
                eventType: "notification.broadcast",
                aggregateType: "NotificationBroadcast",
                aggregateId: eventId,
                payload,
                topic: TOPICS.NOTIFICATION_EVENTS,
            });
        });

        const result = {
            eventId,
            recipientCount: recipientIds.length,
            timestamp,
            deliveryStrategy,
            notificationPriority,
        };

        // If IN_APP channel requested, publish lightweight realtime preview events to Redis
        // so WS subscribers can receive an immediate preview before DB persistence.
        if (channels.includes(NotificationChannel.IN_APP)) {
            try {
                const redis = await getRedisClient();
                const now = new Date().toISOString();
                const PREVIEW_TTL = Number(
                    process.env.NOTIFICATION_PREVIEW_TTL_SECONDS || 60,
                );
                const pipeline = redis.multi();
                for (const u of users) {
                    const redisPayload = JSON.stringify({
                        notification: {
                            previewId: eventId,
                            message,
                            subject: subject ?? null,
                            createdAt: now,
                        },
                    });
                    pipeline.publish(`inapp:${u.id}`, redisPayload);
                    pipeline.set(
                        `notification_preview:${u.id}:${eventId}`,
                        "1",
                        { EX: PREVIEW_TTL },
                    );
                }
                await pipeline.exec();
            } catch (err) {
                logger.warn("Realtime publish failed", err);
            }
        }

        return success(
            "Notifications queued for delivery",
            {
                eventId: result.eventId,
                recipientCount: result.recipientCount,
                channels,
            },
            202, // Accepted (async processing)
        );
    } catch (err) {
        logger.error("Create Notification Error:", err);
        return failure("Internal server error", "Unexpected Error", 500);
    }
}

/* =========================================================
   LIST NOTIFICATIONS
   GET /api/notifications
   ========================================================= */

/**
 * Lists notifications for the authenticated user with
 * pagination support.
 *
 * @async
 * @function handleListNotifications
 * @route GET /api/notifications
 * @param {Request} req - The incoming HTTP request. Supports
 *   query parameters `page` (pagination page, default 1) and
 *   `limit` (items per page, default 50, max 100).
 * @returns {Promise<Response>} JSON response with an array of
 *   notifications and pagination metadata on success, or an
 *   error message with HTTP status code on failure.
 */
export async function handleListNotifications(req: Request): Promise<Response> {
    try {
        const auth = requireAuth(req);
        if (!auth.ok) return auth.response as Response;

        const userId = auth.payload.userId ?? auth.payload.id;

        const url = new URL(req.url);
        const page = Math.max(
            1,
            parseInt(url.searchParams.get("page") || "1", 10),
        );
        const limit = Math.min(
            100,
            Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)),
        );
        const skip = (page - 1) * limit;

        const [list, total] = await Promise.all([
            prisma.notification.findMany({
                where: { userId },
                select: {
                    id: true,
                    type: true,
                    message: true,
                    read: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.notification.count({ where: { userId } }),
        ]);

        return success(
            "Notifications fetched",
            {
                notifications: list,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
            200,
        );
    } catch (err) {
        logger.error("List Notifications Error:", err);
        return failure("Internal server error", "Unexpected Error", 500);
    }
}
