import type { EachMessagePayload } from "kafkajs";
import prisma from "@modheshwari/db";

import { createConsumer, TOPICS } from "../config";
import { publishToChannel } from "../notificationProducer";
import type { NotificationEvent } from "../notificationProducer";
import { scheduleEscalation } from "./escalation";
import { ensureIdempotent } from "../../lib/kafkaIdempotency";

/**
 * Retrieve recipient details (email, FCM token, phone, preferences)
 * In production, this would query from database
 */
async function getRecipientDetails(recipientId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: recipientId },
            include: { profile: true },
        });

        if (!user) {
            return null;
        }

        return {
            email: user.email,
            fcmToken: user.profile?.fcmToken || null,
            phone: user.profile?.phone || null,
            notificationPreferences: user.profile?.notificationPreferences as Record<
                string,
                boolean
            > | null,
        };
    } catch {
        return null;
    }
}

/**
 * Batch-fetch recipient details for multiple recipients in a single query.
 */
async function getRecipientDetailsBatch(recipientIds: string[]) {
    try {
        const users = await prisma.user.findMany({
            where: { id: { in: recipientIds } },
            include: { profile: true },
        });

        const map = new Map<string, Awaited<ReturnType<typeof getRecipientDetails>>>();
        for (const user of users) {
            map.set(user.id, {
                email: user.email,
                fcmToken: user.profile?.fcmToken || null,
                phone: user.profile?.phone || null,
                notificationPreferences: user.profile?.notificationPreferences as Record<
                    string,
                    boolean
                > | null,
            });
        }

        return map;
    } catch {
        return new Map<string, Awaited<ReturnType<typeof getRecipientDetails>>>();
    }
}
/**
 * Check if recipient has enabled channel in their preferences
 */
function isChannelEnabled(
    channel: string,
    preferences?: Record<string, boolean> | null,
): boolean {
    // Default: all channels enabled if no preferences set
    if (!preferences) return true;

    // Check preference for this channel
    const key = `${channel.toLowerCase()}_enabled`;
    return preferences[key] !== false;
}

/**
 * Router consumer worker
 * Routes notifications to appropriate channels based on:
 * - Delivery strategy (BROADCAST or ESCALATION)
 * - Priority level (CRITICAL always uses broadcast)
 * - User preferences
 * - Channel availability (e.g., has FCM token for push)
 */
export async function startRouterConsumer(): Promise<void> {
    const consumer = createConsumer("notifications-router");

    await consumer.connect();
    await consumer.subscribe({
        topic: TOPICS.NOTIFICATION_EVENTS,
        fromBeginning: false,
    });

    await consumer.run({
        eachMessage: async ({ topic: _topic, partition: _partition, message }: EachMessagePayload) => {
            try {
                const isDuplicate = await ensureIdempotent(message.key);
                if (isDuplicate) {
                    return;
                }

                if (!message.value) {
                    return;
                }

                const eventData = JSON.parse(message.value.toString());
                if (!eventData || typeof eventData !== "object") {
                    return;
                }

                const event: NotificationEvent = eventData;
                const deliveryStrategy = eventData.deliveryStrategy as
                    | "BROADCAST"
                    | "ESCALATION"
                    | undefined;
                const notificationPriority = eventData.notificationPriority as
                    | "LOW"
                    | "MEDIUM"
                    | "HIGH"
                    | "CRITICAL"
                    | undefined;
                const notificationId = eventData.notificationId as string | undefined;
                const recipientIds = Array.isArray(eventData.recipientIds)
                    ? eventData.recipientIds
                    : null;
                const channels = Array.isArray(eventData.channels)
                    ? eventData.channels
                    : null;

                if (!recipientIds || !channels) {
                    return;
                }

                if (
                    !recipientIds.every(
                        (id: unknown) => typeof id === "string" && id.length > 0,
                    )
                ) {
                    return;
                }

                if (
                    !channels.every(
                        (channel: unknown) =>
                            typeof channel === "string" && channel.length > 0,
                    )
                ) {
                    return;
                }

                if (
                    deliveryStrategy &&
                    !["BROADCAST", "ESCALATION"].includes(deliveryStrategy)
                ) {
                    return;
                }

                if (
                    notificationPriority &&
                    !["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(notificationPriority)
                ) {
                    return;
                }

                // Default to BROADCAST strategy
                const strategy = deliveryStrategy || "BROADCAST";
                const priority = notificationPriority || "MEDIUM";

                // Critical notifications always use broadcast
                const useEscalation =
                    strategy === "ESCALATION" && priority !== "CRITICAL";

                // Route to each recipient
                const recipientDetailsMap = await getRecipientDetailsBatch(recipientIds);

                for (const recipientId of recipientIds) {
                    try {
                        // Fetch recipient details
                        const recipientDetails = recipientDetailsMap.get(recipientId);
                        if (!recipientDetails) {
                            continue;
                        }

                        if (useEscalation) {
                            // ESCALATION STRATEGY: In-app first, then schedule SMS and Email
                            // Always send in-app notification immediately
                            if (
                                channels.includes("IN_APP") &&
                                isChannelEnabled(
                                    "IN_APP",
                                    recipientDetails.notificationPreferences,
                                )
                            ) {
                                await publishToChannel(
                                    "IN_APP" as any,
                                    recipientId,
                                    event as any,
                                );
                            }

                            // Schedule escalation to SMS and EMAIL if notification is not read
                            if (notificationId) {
                                const escalationChannels = {
                                    //handle the email case
                                    email:
                                        recipientDetails.email &&
                                            isChannelEnabled(
                                                "EMAIL",
                                                recipientDetails.notificationPreferences,
                                            )
                                            ? recipientDetails.email
                                            : undefined,
                                    //handle sms case
                                    sms:
                                        recipientDetails.phone &&
                                            isChannelEnabled(
                                                "SMS",
                                                recipientDetails.notificationPreferences,
                                            )
                                            ? recipientDetails.phone
                                            : undefined,
                                };

                                if (escalationChannels.email || escalationChannels.sms) {
                                    await scheduleEscalation(notificationId, escalationChannels);
                                }
                            }
                        } else {
                            // BROADCAST STRATEGY: Send to all channels immediately
                            for (const channel of channels) {
                                // Check if channel is enabled in user preferences
                                if (
                                    !isChannelEnabled(
                                        channel,
                                        recipientDetails.notificationPreferences,
                                    )
                                ) {
                                    continue;
                                }

                                // Check channel-specific requirements
                                if (channel === "PUSH" && !recipientDetails.fcmToken) {
                                    continue;
                                }

                                if (channel === "SMS" && !recipientDetails.phone) {
                                    continue;
                                }

                                // Route message to channel topic
                                await publishToChannel(channel as any, recipientId, {
                                    ...event,
                                    ...(channel === "EMAIL" && {
                                        recipientEmail: recipientDetails.email,
                                    }),
                                    ...(channel === "PUSH" && {
                                        fcmToken: recipientDetails.fcmToken,
                                    }),
                                    ...(channel === "SMS" && {
                                        recipientPhone: recipientDetails.phone,
                                    }),
                                } as any);
                            }
                        }
                    } catch {
                        // Continue with next recipient even if one fails
                        void 0;
                    }
                }
            } catch { /* continue with next recipient */ }
        },
    });
}
