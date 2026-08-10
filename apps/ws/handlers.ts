import type { ServerWebSocket } from "bun";
import { Prisma } from "@prisma/client";
import prisma from "@modheshwari/db";

import type { WSData, IncomingMessage, ChatMessage } from "./types";
import {
    MAX_MESSAGE_SIZE,
    HEARTBEAT_INTERVAL,
    CONNECTION_TIMEOUT,
} from "./config";
import {
    addSocket,
    removeSocket,
    checkRateLimit,
    getMessageSize,
    pushToUser,
} from "./utils";
import { logger } from "./logger";

/**
 * Handle new WebSocket connection.
 */
export function handleOpen(ws: ServerWebSocket<WSData>) {
    addSocket(ws.data.userId, ws);
    logger.info("WebSocket connected", { userId: ws.data.userId });

    ws.send(JSON.stringify({ type: "connected", userId: ws.data.userId }));

    ws.data.lastSeen = Date.now();
    const heartbeatId = setInterval(() => {
        const now = Date.now();
        if (now - ws.data.lastSeen > CONNECTION_TIMEOUT) {
            try {
                ws.close();
            } catch (err) {
                logger.warn("Failed to close websocket due to connection timeout", {
                    error: err instanceof Error ? err.message : String(err),
                    userId: ws.data.userId,
                });
            }
            return;
        }

        try {
            ws.send(JSON.stringify({ type: "ping" }));
        } catch (err) {
            // Log heartbeat send failures for observability; close handler will clean up
            logger.debug("Heartbeat send failed", {
                error: err instanceof Error ? err.message : String(err),
                userId: ws.data.userId,
            });
        }
    }, HEARTBEAT_INTERVAL) as unknown as number;
    ws.data.heartbeatId = heartbeatId;

    // Reconcile missed notifications on connect
    reconcileMissedNotifications(ws.data.userId);
}

async function reconcileMissedNotifications(userId: string) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId, read: false },
      select: { id: true, type: true, message: true, createdAt: true, eventId: true },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    for (const n of notifications) {
      pushToUser(userId, {
        type: "notification",
        notification: {
          eventId: n.eventId ?? undefined,
          message: n.message,
          type: n.type,
          timestamp: n.createdAt.toISOString(),
        },
      });
    }
  } catch (err) {
    logger.error("Failed to reconcile notifications", {
      error: err instanceof Error ? err.message : String(err),
      userId,
    });
  }
}

/**
 * Handle incoming WebSocket message.
 */
export async function handleMessage(
    ws: ServerWebSocket<WSData>,
    message: string | Uint8Array,
) {
    const userId = ws.data.userId;
    const size = getMessageSize(message);

    if (!checkRateLimit(userId)) {
        try {
            ws.send(
                JSON.stringify({ type: "error", message: "Rate limit exceeded" }),
            );
        } catch (err) {
            logger.warn("Failed to send rate-limit message", {
                error: err instanceof Error ? err.message : String(err),
                userId,
            });
        }
        return;
    }

    if (size > MAX_MESSAGE_SIZE) {
        try {
            ws.send(JSON.stringify({ type: "error", message: "Message too large" }));
        } catch (err) {
            logger.warn("Failed to send message-too-large response", {
                error: err instanceof Error ? err.message : String(err),
                userId,
            });
        }
        return;
    }

    try {
        const raw =
            typeof message === "string"
                ? message
                : new TextDecoder().decode(message as Uint8Array);
        if (!raw) return;
        const data = JSON.parse(raw) as IncomingMessage;
        ws.data.lastSeen = Date.now();

        if (data.type === "chat") {
            await handleChatMessage(ws, data, userId);
        } else if (data.type === "typing") {
            handleTypingIndicator(data, userId);
        } else if (data.type === "read") {
            await handleReadReceipt(data, userId);
        } else if (data.type === "sync") {
            await handleSync(ws, data, userId);
        }
    } catch (err) {
        logger.error("Failed to handle message", {
            error: err instanceof Error ? err.message : String(err),
            userId,
        });
        try {
            ws.send(
                JSON.stringify({ type: "error", message: "Failed to process message" }),
            );
        } catch (sendErr) {
            logger.warn("Failed to send failure notification to websocket", {
                error: sendErr instanceof Error ? sendErr.message : String(sendErr),
                userId,
            });
        }
    }
}

/**
 * Handle chat message.
 */
async function handleChatMessage(
    ws: ServerWebSocket<WSData>,
    data: IncomingMessage,
    userId: string,
) {
    const conversationId = data.conversationId;
    if (!conversationId) return;
    const content = data.content;
    if (!content) return;
    if (content.length > 10000) {
        ws.send(JSON.stringify({ type: "error", message: "Message too long" }));
        return;
    }

    const result = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
            const conversation = await tx.conversation.findFirst({
                where: {
                    id: conversationId,
                    participants: { has: userId },
                },
            });

            if (!conversation) {
                throw new Error("User not in conversation");
            }

            const sender = await tx.user.findUnique({
                where: { id: userId },
                select: { name: true },
            });

            if (!sender) {
                throw new Error("Sender not found");
            }

            const savedMessage = await tx.message.create({
                data: {
                    conversationId,
                    senderId: userId,
                    senderName: sender.name,
                    content,
                    readBy: [userId],
                },
            });

            await tx.conversation.update({
                where: { id: conversationId },
                data: {
                    lastMessage: content,
                    lastMessageAt: savedMessage.createdAt,
                },
            });

            return { savedMessage, sender, conversation };
        },
    );

    const chatPayload: ChatMessage = {
        type: "chat",
        messageId: result.savedMessage.id,
        conversationId,
        senderId: userId,
        senderName: result.sender.name,
        content,
        timestamp: result.savedMessage.createdAt.toISOString(),
    };

    for (const recipientId of result.conversation.participants) {
        pushToUser(recipientId, chatPayload);
    }
}

/**
 * Handle typing indicator.
 */
function handleTypingIndicator(data: IncomingMessage, userId: string) {
    if (!data.conversationId || !data.recipientIds) return;
    if (!Array.isArray(data.recipientIds) || data.recipientIds.length > 50) {
        return;
    }

    const typingPayload = {
        type: "typing",
        conversationId: data.conversationId,
        userId,
        timestamp: new Date().toISOString(),
    };

    for (const recipientId of data.recipientIds) {
        if (recipientId !== userId) {
            pushToUser(recipientId, typingPayload);
        }
    }
}

/**
 * Handle read receipt.
 */
async function handleReadReceipt(data: IncomingMessage, userId: string) {
    if (!data.messageIds) return;
    if (!Array.isArray(data.messageIds) || data.messageIds.length > 100) {
        return;
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.message.updateMany({
            where: {
                id: { in: data.messageIds },
                senderId: { not: userId },
            },
            data: {
                readBy: { push: userId },
            },
        });

        const messages = await tx.message.findMany({
            where: { id: { in: data.messageIds } },
            select: { id: true, senderId: true, conversationId: true },
        });

        // Batch read receipts by senderId + conversationId to avoid per-message WS sends
        const grouped = new Map<
            string,
            { senderId: string; conversationId: string; ids: string[] }
        >();
        for (const msg of messages) {
            const key = `${msg.senderId}:${msg.conversationId}`;
            if (!grouped.has(key)) {
                grouped.set(key, {
                    senderId: msg.senderId,
                    conversationId: msg.conversationId,
                    ids: [],
                });
            }
            grouped.get(key)!.ids.push(msg.id);
        }

        const ts = new Date().toISOString();
        for (const { senderId, conversationId, ids } of grouped.values()) {
            pushToUser(senderId, {
                type: "read",
                messageIds: ids,
                conversationId,
                userId,
                timestamp: ts,
            });
        }
    });
}

/**
 * Handle WebSocket connection close.
 */
export function handleClose(ws: ServerWebSocket<WSData>) {
    removeSocket(ws.data.userId, ws);
    if (ws.data.heartbeatId) {
        clearInterval(ws.data.heartbeatId);
    }
    logger.info("disconnected", { userId: ws.data.userId });
}

/**
 * Handle sync request: return missed messages since lastSeenAt.
 */
async function handleSync(
    ws: ServerWebSocket<WSData>,
    data: IncomingMessage,
    userId: string,
) {
    const lastSeenAt = data.lastSeenAt ? new Date(data.lastSeenAt) : new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (isNaN(lastSeenAt.getTime())) {
        ws.send(JSON.stringify({ type: "error", message: "Invalid lastSeenAt" }));
        return;
    }

    try {
        const conversations = await prisma.conversation.findMany({
            where: { participants: { has: userId } },
            select: { id: true },
        });

        const conversationIds = conversations.map((c) => c.id);
        if (conversationIds.length === 0) {
            ws.send(JSON.stringify({ type: "sync", messages: [] }));
            return;
        }

        const messages = await prisma.message.findMany({
            where: {
                conversationId: { in: conversationIds },
                createdAt: { gt: lastSeenAt },
            },
            orderBy: { createdAt: "asc" },
            take: 200,
            select: {
                id: true,
                conversationId: true,
                senderId: true,
                senderName: true,
                content: true,
                createdAt: true,
            },
        });

        ws.send(JSON.stringify({
            type: "sync",
            messages: messages.map((m) => ({
                type: "chat",
                messageId: m.id,
                conversationId: m.conversationId,
                senderId: m.senderId,
                senderName: m.senderName,
                content: m.content,
                timestamp: m.createdAt.toISOString(),
            })),
        }));
    } catch (err) {
        logger.error("Sync failed", {
            error: err instanceof Error ? err.message : String(err),
            userId,
        });
        ws.send(JSON.stringify({ type: "error", message: "Sync failed" }));
    }
}
