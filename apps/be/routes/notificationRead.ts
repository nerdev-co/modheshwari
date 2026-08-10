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

    // Update notification as read
    const notification = await prisma.$transaction((tx) =>
      tx.notification.update({
        where: {
          id: notificationId,
          userId, // Ensure user can only mark their own notifications
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      }),
    );

    await prisma.$transaction(async (tx) => {
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

    // Update all notifications as read
    const [result, updatedNotifications] = await prisma.$transaction([
      prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId, // Ensure user can only mark their own notifications
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      }),
      prisma.notification.findMany({
        where: {
          id: { in: notificationIds },
          userId,
          read: true,
          readAt: { not: null },
        },
        select: { id: true },
      }),
    ]);

    const updatedIds = updatedNotifications.map(n => n.id);
    
    await prisma.$transaction(async (tx) => {
      const events = updatedIds.map((id) => ({
        eventType: "notification.read",
        aggregateType: "Notification",
        aggregateId: id,
        payload: {
          notificationId: id,
          userId,
          readAt: new Date().toISOString(),
        },
        topic: TOPICS.NOTIFICATION_READ,
      }));
      await createOutboxEvents(tx, events);
    });

    return new Response(
      JSON.stringify({
        success: true,
        updatedCount: result.count,
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

    // Get all unread notification IDs
    const [unreadNotifications, result] = await prisma.$transaction([
      prisma.notification.findMany({
        where: {
          userId,
          read: false,
        },
        select: { id: true },
      }),
      prisma.notification.updateMany({
        where: {
          userId,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      }),
    ]);

    // Publish read events via outbox
    if (unreadNotifications.length > 0) {
      await prisma.$transaction(async (tx) => {
        const events = unreadNotifications.map((notif) => ({
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
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        updatedCount: result.count,
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

