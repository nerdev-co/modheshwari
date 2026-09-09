import { randomUUID } from "crypto";

import { NotificationType, NotificationChannel } from "@prisma/client";

import { producer, TOPICS } from "./config";
import { logger } from "../lib/logger";

export type DeliveryStrategy = "BROADCAST" | "ESCALATION";
export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface NotificationEvent {
  eventId: string;
  message: string;
  type: NotificationType;
  channels: NotificationChannel[];
  subject?: string;
  recipientIds: string[];
  senderId: string;
  priority: "low" | "normal" | "high" | "urgent";
  timestamp: string;
  deliveryStrategy?: DeliveryStrategy;
  notificationPriority?: NotificationPriority;
  notificationId?: string; // Database notification ID for tracking
}

/**
 * Broadcast a notification event to Kafka
 * This will be consumed by the router worker which will route to appropriate channels
 * 
 * @param params - Notification parameters
 * @param params.deliveryStrategy - BROADCAST (all channels immediately) or ESCALATION (progressive delivery)
 * @param params.notificationPriority - Priority level (CRITICAL always uses broadcast)
 */
export async function broadcastNotification(
  params: Omit<NotificationEvent, "eventId" | "timestamp">,
) {
  const eventId = randomUUID();
  const timestamp = new Date().toISOString();

  // Default to BROADCAST strategy and MEDIUM priority
  let deliveryStrategy = params.deliveryStrategy || "BROADCAST";
  const notificationPriority = params.notificationPriority || "MEDIUM";

  // CRITICAL priority always uses BROADCAST strategy
  if (notificationPriority === "CRITICAL") {
    deliveryStrategy = "BROADCAST";
  }

  const event: NotificationEvent = {
    ...params,
    eventId,
    timestamp,
    deliveryStrategy,
    notificationPriority,
  };

  try {
    // Ensure producer is connected
    await producer.connect();

    // Publish event to the main notification events topic
    await producer.send({
      topic: TOPICS.NOTIFICATION_EVENTS,
      messages: [
        {
          key: eventId, // Use eventId as key for partitioning
          value: JSON.stringify(event),
          headers: {
            "event-type": "notification.broadcast",
            "sender-id": String(params.senderId),
            priority: params.priority,
            "delivery-strategy": deliveryStrategy,
            "notification-priority": notificationPriority,
          },
        },
      ],
    });

    console.log(
      `✓ Notification event ${eventId} published to Kafka (${deliveryStrategy}/${notificationPriority})`
    );

    return {
      eventId,
      recipientCount: params.recipientIds.length,
      timestamp,
      deliveryStrategy,
      notificationPriority,
    };
  } catch (error) {
    logger.error("Failed to publish notification event:", error);
    throw new Error("Failed to queue notification for delivery");
  }
}

/**
 * Publish a channel-specific notification
 * Used by the router consumer to send to specific delivery channels
 */
export async function publishToChannel(
  channel: NotificationChannel,
  recipientId: string,
  event: NotificationEvent,
) {
  const topicMap: Record<NotificationChannel, string> = {
    IN_APP: TOPICS.NOTIFICATION_EVENTS, // In-app handled by router directly
    EMAIL: TOPICS.NOTIFICATION_EMAIL,
    PUSH: TOPICS.NOTIFICATION_PUSH,
    SMS: TOPICS.NOTIFICATION_SMS,
  };

  const topic = topicMap[channel];

  if (!topic) {
    logger.error(`Unknown channel: ${channel}`);
    return;
  }

  try {
    await producer.send({
      topic,
      messages: [
        {
          key: `${recipientId}`, // Use recipientId for partitioning
          value: JSON.stringify({
            ...event,
            recipientId,
            channel,
          }),
          headers: {
            channel: channel,
            "recipient-id": String(recipientId),
            "event-id": event.eventId,
          },
        },
      ],
    });

    console.log(
      `Published to ${channel} channel for recipient ${recipientId}`,
    );
  } catch (error) {
    logger.error(`Failed to publish to ${channel} channel:`, error);
    throw error;
  }
}
