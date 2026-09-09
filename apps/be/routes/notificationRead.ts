/**
 * Notification Read Tracking API
 * 
 * Handles marking notifications as read and publishing read events
 * to Kafka to trigger escalation cancellation.
 */

import prisma from "@modheshwari/db";
import { verifyJWT } from "@modheshwari/utils/jwt";

import { createOutboxEvent, createOutboxEvents } from "../lib/outbox";
import { TOPICS } from "../kafka/config";

  /**
   * Mark a notification as read
 * POST /api/notifications/:id/read
 */
export async function handleMarkAsRead(req: Request, id: string): Promise<Response> {
  try {
    const authHeader = req.headers.get("authorization");
    
    // Validate Authorization header format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid Bearer token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix
    const payload = verifyJWT(token);

    if (!payload || typeof payload === "string") {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = payload.userId as string;
    const notificationId = id;

    // Mark read + outbox event in a single transaction so the notification
    // is never marked read without the Kafka event being written
    const notification = await prisma.$transaction(async (tx) => {
      const updated = await tx.notification.update({
        where: {
          id: notificationId,
          userId,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      await createOutboxEvent(tx, {
        eventType: "notification.read",
        aggregateType: "Notification",
        aggregateId: notificationId,
        payload: {
          notificationId,
          userId,
          readAt: new Date().toISOString(),
        },
        topic: TOPICS.NOTIFICATION_READ,
      });

      return updated;
    });

    return new Response(
      JSON.stringify({
        success: true,
        notification: {
          id: notification.id,
          read: notification.read,
          readAt: notification.readAt,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Check if error is Prisma record-not-found
    const isNotFound = 
      error && 
      typeof error === "object" && 
      "code" in error && 
      error.code === "P2025";
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to mark notification as read",
      }),
      {
        status: isNotFound ? 404 : 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Mark multiple notifications as read
 * POST /api/notifications/read-multiple
 */
export async function handleMarkMultipleAsRead(req: Request): Promise<Response> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid Bearer token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = authHeader.slice(7);
    const payload = verifyJWT(token);

    if (!payload || typeof payload === "string") {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = payload.userId as string;
    const body = await req.json();
    const { notificationIds } = body as { notificationIds: string[] };

    if (!Array.isArray(notificationIds)) {
      return new Response(JSON.stringify({ error: "notificationIds must be an array" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Mark read + outbox events in a single transaction
    const updatedNotifications = await prisma.$transaction(async (tx) => {
      await tx.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      const updated = await tx.notification.findMany({
        where: {
          id: { in: notificationIds },
          userId,
          read: true,
          readAt: { not: null },
        },
        select: { id: true },
      });

      if (updated.length > 0) {
        const events = updated.map((n) => ({
          eventType: "notification.read",
          aggregateType: "Notification",
          aggregateId: n.id,
          payload: {
            notificationId: n.id,
            userId,
            readAt: new Date().toISOString(),
          },
          topic: TOPICS.NOTIFICATION_READ,
        }));
        await createOutboxEvents(tx, events);
      }

      return updated;
    });

    const updatedIds = updatedNotifications.map(n => n.id);

    return new Response(
      JSON.stringify({
        success: true,
        updatedCount: updatedIds.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to mark notifications as read",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Mark all notifications as read for a user
 * POST /api/notifications/read-all
 */
export async function handleMarkAllAsRead(req: Request): Promise<Response> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid Bearer token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = authHeader.slice(7);
    const payload = verifyJWT(token);

    if (!payload || typeof payload === "string") {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = payload.userId as string;

    // Get all unread, mark read, and write outbox events in one transaction
    const unreadNotifications = await prisma.$transaction(async (tx) => {
      const unread = await tx.notification.findMany({
        where: {
          userId,
          read: false,
        },
        select: { id: true },
      });

      await tx.notification.updateMany({
        where: {
          userId,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      if (unread.length > 0) {
        const events = unread.map((notif) => ({
          eventType: "notification.read",
          aggregateType: "Notification",
          aggregateId: notif.id,
          payload: {
            notificationId: notif.id,
            userId,
            readAt: new Date().toISOString(),
          },
          topic: TOPICS.NOTIFICATION_READ,
        }));
        await createOutboxEvents(tx, events);
      }

      return unread;
    });

    return new Response(
      JSON.stringify({
        success: true,
        updatedCount: unreadNotifications.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({
        error: "Failed to mark all notifications as read",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Get delivery status for a notification (for debugging/monitoring)
 * GET /api/notifications/:id/delivery-status
 */
export async function handleGetDeliveryStatus(req: Request, id: string): Promise<Response> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid Bearer token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = authHeader.slice(7);
    const payload = verifyJWT(token);

    if (!payload || typeof payload === "string") {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = payload.userId as string;
    const notificationId = id;

    // Get notification with deliveries
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
      select: {
        id: true,
        read: true,
        readAt: true,
        deliveryStrategy: true,
        priority: true,
        deliveries: {
          select: {
            channel: true,
            status: true,
            attemptCount: true,
            scheduledFor: true,
            deliveredAt: true,
            error: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!notification) {
      return new Response(JSON.stringify({ error: "Notification not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        notification: {
          id: notification.id,
          read: notification.read,
          readAt: notification.readAt,
          deliveryStrategy: notification.deliveryStrategy,
          priority: notification.priority,
        },
        deliveries: notification.deliveries,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching delivery status:");
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to fetch delivery status",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

