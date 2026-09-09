import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";

import { requireAuth } from "../authMiddleware";

/**
 * GET /api/messages/:conversationId
 * Get messages for a conversation with pagination
 */
export async function handleGetMessages(
  req: Request,
  conversationId: string
): Promise<Response> {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const userId = auth.payload.userId as string;

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const before = url.searchParams.get("before"); // Message ID for pagination

  try {
    // Verify user is part of conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          has: userId,
        },
      },
    });

    if (!conversation) {
      return failure("Conversation not found", null, 404);
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        ...(before && {
          createdAt: {
            lt: (
              await prisma.message.findUnique({
                where: { id: before },
                select: { createdAt: true },
              })
            )?.createdAt,
          },
        }),
      },
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        senderName: true,
        content: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: limit,
    });

    return success("Messages retrieved", messages);
  } catch {
    return failure("Failed to fetch messages", null, 500);
  }
}

/**
 * POST /api/messages
 * Send a message in a conversation
 */
export async function handleSendMessage(req: Request): Promise<Response> {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const userId = auth.payload.userId as string;

  try {
    const body = await req.json();
    const { conversationId, content } = body as {
      conversationId?: string;
      content?: string;
    };

    if (!conversationId || !content) {
      return failure("Missing required fields", null, 400);
    }

    // Verify user is part of conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          has: userId,
        },
      },
    });

    if (!conversation) {
      return failure("Conversation not found", null, 404);
    }

    // Get sender's name
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    if (!user) {
      return failure("User not found", null, 404);
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        senderName: user.name,
        content,
      },
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        senderName: true,
        content: true,
        createdAt: true,
      },
    });

    // Update conversation's last message timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return success("Message sent", message, 201);
  } catch {
    return failure("Failed to send message", null, 500);
  }
}

/**
 * PUT /api/messages/mark-read
 * Mark all messages in a conversation as read
 */
export async function handleMarkMessagesRead(req: Request): Promise<Response> {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;
  const userId = auth.payload.userId as string;

  try {
    const body = await req.json();
    const { conversationId } = body as { conversationId?: string };

    if (!conversationId) {
      return failure("Missing conversationId", null, 400);
    }

    // Verify user is part of conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          has: userId,
        },
      },
    });

    if (!conversation) {
      return failure("Conversation not found", null, 404);
    }

    // Update all unread messages in the conversation for this user
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        NOT: { readBy: { has: userId } },
      },
      data: {
        readBy: { push: userId },
      },
    });

    return success("Messages marked as read");
  } catch {
    return failure("Failed to mark messages as read", null, 500);
  }
}
