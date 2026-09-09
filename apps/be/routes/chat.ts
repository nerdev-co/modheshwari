import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";

import { getUserIdFromRequest } from "./messages/auth";

// GET /api/chat
/**
 * Retrieves the authenticated user's chat list, including
 * personal conversations and a family-wide conversation.
 *
 * The personal conversations are sorted by most recent message.
 * The family conversation is found by looking up the user's
 * active family membership, then either locating an existing
 * conversation that includes all family members or creating a
 * new one.
 *
 * @async
 * @function handleGetChat
 * @route GET /api/chat
 * @param {Request} req - The incoming HTTP request.
 * @returns {Promise<Response>} JSON response with `personal`
 *   (array of personal conversations) and `familyChat`
 *   (the family-wide conversation or null) on success, or
 *   an error message with HTTP status code on failure.
 */
export async function handleGetChat(req: Request) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return failure("Unauthorized", null, 401);

  try {
    // 1. Personal conversations (most recent)
    const personal = await prisma.conversation.findMany({
      where: { participants: { has: userId } },
      orderBy: { lastMessageAt: "desc" },
      include: { messages: { take: 1, orderBy: { createdAt: "desc" } } },
    });

    // 2. Determine user's active family (take most recent FamilyMember)
    const fm = await prisma.familyMember.findFirst({
      where: { userId },
      orderBy: { joinedAt: "desc" },
    });

    let familyChat = null;

    if (fm) {
      const familyMembers = await prisma.familyMember.findMany({
        where: { familyId: fm.familyId },
        select: { userId: true },
      });

      const memberIds = familyMembers.map((m) => m.userId);

      if (memberIds.length > 0) {
        // Wrap findFirst + create in a transaction to reduce (but not eliminate)
        // the race window for duplicate conversations.
        // A unique constraint on participants would fully prevent this.
        familyChat = await prisma.$transaction(async (tx) => {
          const existing = await tx.conversation.findFirst({
            where: {
              participants: { hasEvery: memberIds },
            },
            include: { messages: { take: 1, orderBy: { createdAt: "desc" } } },
          });

          if (existing) return existing;

          return tx.conversation.create({
            data: { participants: memberIds },
            include: { messages: { take: 1, orderBy: { createdAt: "desc" } } },
          });
        });
      }
    }

    return success("Chats retrieved", { personal, familyChat });
  } catch (err) {
    console.error("Failed to fetch chat list:", err);
    return failure("Failed to fetch chat list", null, 500);
  }
}
