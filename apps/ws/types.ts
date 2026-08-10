import type { ServerWebSocket } from "bun";
import { NotificationChannel } from "@prisma/client";

export type WSData = {
    userId: string;
    lastSeen: number;
    heartbeatId?: number;
};

export type NotificationEvent = {
    eventId: string;
    message: string;
    type: string;
    channels: NotificationChannel[];
    subject?: string;
    recipientIds: string[];
    senderId: string;
    priority: "low" | "normal" | "high" | "urgent";
    timestamp: string;
};

export type ChatMessage = {
    type: "chat";
    messageId: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: string;
};

export type IncomingMessage = {
    type: "chat" | "typing" | "read" | "sync";
    conversationId?: string;
    content?: string;
    recipientIds?: string[];
    messageIds?: string[];
    lastSeenAt?: string;
};

export type WSMap = Map<string, Set<ServerWebSocket<WSData>>>;
export type RateLimitMap = Map<string, { count: number; resetAt: number }>;
