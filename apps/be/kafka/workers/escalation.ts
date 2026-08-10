/**
 * Escalation Worker
 * 
 * Handles the notification escalation pattern:
 * 1. In-app notification sent immediately
 * 2. If not read after 10 minutes → send SMS
 * 3. If not read after 30 more minutes → send email
 * 
 * This worker processes scheduled notifications and cancels escalation
 * when notifications are marked as read.
 */

import type { Consumer } from "kafkajs";
import prisma from "@modheshwari/db";

import { kafka } from "../config";
import { publishToChannel } from "../notificationProducer";
import { ensureIdempotent } from "../../lib/kafkaIdempotency";

// Escalation timings (in milliseconds)
const ESCALATION_DELAYS = {
    SMS: 10 * 60 * 1000, // 10 minutes after in-app
    EMAIL: 40 * 60 * 1000, // 40 minutes total (10 + 30)
};

/**
 * Process notifications that are ready for escalation
 */
async function processEscalation() {
    try {
        let _processedCount = 0;

        while (true) {
            const readyDeliveries = await claimReadyDeliveries(100);
            if (readyDeliveries.length === 0) break;

            for (const delivery of readyDeliveries) {
                const now = new Date();
                const { notification } = delivery;

                // Check if notification has been read - if yes, cancel remaining escalations
                if (notification.read) {
                    await cancelEscalation(notification.id);
                    continue;
                }

                // Send to the scheduled channel
                try {
                    await publishToChannel(delivery.channel as any, notification.userId, {
                        eventId: delivery.notificationId,
                        message: notification.message,
                        type: notification.type,
                        channels: [delivery.channel as any],
                        recipientIds: [notification.userId],
                        senderId: "system",
                        priority: "normal",
                    } as any);

                    // Update delivery status to SENT
                    await prisma.notificationDelivery.update({
                        where: { id: delivery.id },
                        data: {
                            status: "SENT",
                            attemptCount: { increment: 1 },
                            lastAttemptAt: now,
                            deliveredAt: now,
                        },
                    });
                } catch (error) {
                    const nextAttemptCount = delivery.attemptCount + 1;
                    const shouldFail = nextAttemptCount >= 3;

                    // Mark as failed and retry later
                    await prisma.notificationDelivery.update({
                        where: { id: delivery.id },
                        data: {
                            status: shouldFail ? "FAILED" : "SCHEDULED",
                            attemptCount: { increment: 1 },
                            lastAttemptAt: now,
                            error: error instanceof Error ? error.message : "Unknown error",
                            // Retry in 5 minutes if not exceeded max attempts
                            scheduledFor: !shouldFail
                                ? new Date(now.getTime() + 5 * 60 * 1000)
                                : delivery.scheduledFor,
                        },
                    });
                }
            }

            _processedCount += readyDeliveries.length;
        }
    } catch {
        // Error processing escalations
    }
}

/**
 * Performs claim ready deliveries operation.
 * @returns {Promise<({ notification: { user: { profile: { id: string; status: string; userId: string; phone: string; address: string; profession: string; gotra: string; location: string; locationLat: number; locationLng: number; locationUpdatedAt: Date; bloodGroup: string; allergies: string; medicalNotes: string; fcmToken: string; notificationPreferences: import("/Users/nalindalal/modheshwari/node_modules/@prisma/client/runtime/library").JsonValue; }; } & { id: string; status: boolean; createdAt: Date; updatedAt: Date; name: string; email: string; password: string; role: import("/Users/nalindalal/modheshwari/node_modules/.prisma/client/index").$Enums.Role; }; } & { message: string; id: string; channel: import("/Users/nalindalal/modheshwari/node_modules/.prisma/client/index").$Enums.NotificationChannel; metadata: import("/Users/nalindalal/modheshwari/node_modules/@prisma/client/runtime/library").JsonValue; createdAt: Date; userId: string; type: import("/Users/nalindalal/modheshwari/node_modules/.prisma/client/index").$Enums.NotificationType; read: boolean; readAt: Date; deliveryStrategy: import("/Users/nalindalal/modheshwari/node_modules/.prisma/client/index").$Enums.DeliveryStrategy; priority: import("/Users/nalindalal/modheshwari/node_modules/.prisma/client/index").$Enums.NotificationPriority; eventId: string; resourceRequestId: string; paymentId: string; statusUpdateRequestId: string; }; } & { error: string; id: string; notificationId: string; channel: import("/Users/nalindalal/modheshwari/node_modules/.prisma/client/index").$Enums.NotificationChannel; status: import("/Users/nalindalal/modheshwari/node_modules/.prisma/client/index").$Enums.DeliveryStatus; attemptCount: number; lastAttemptAt: Date; deliveredAt: Date; scheduledFor: Date; metadata: import("/Users/nalindalal/modheshwari/node_modules/@prisma/client/runtime/library").JsonValue; createdAt: Date; updatedAt: Date; })[]>} Description of return value
 */
async function claimReadyDeliveries(batchSize: number) {
    const now = new Date();

    return prisma.$transaction(async (tx) => {
        const candidates = await tx.notificationDelivery.findMany({
            where: {
                status: "SCHEDULED",
                scheduledFor: {
                    lte: now,
                },
            },
            include: {
                notification: {
                    include: {
                        user: {
                            include: {
                                profile: true,
                            },
                        },
                    },
                },
            },
            take: batchSize,
        });

        if (candidates.length === 0) return [];

        const candidateIds = candidates.map((delivery) => delivery.id);

        await tx.notificationDelivery.updateMany({
            where: {
                id: { in: candidateIds },
                status: "SCHEDULED",
            },
            data: {
                status: "PROCESSING",
                lastAttemptAt: now,
            },
        });

        return tx.notificationDelivery.findMany({
            where: {
                id: { in: candidateIds },
                status: "PROCESSING",
                lastAttemptAt: now,
            },
            include: {
                notification: {
                    include: {
                        user: {
                            include: {
                                profile: true,
                            },
                        },
                    },
                },
            },
        });
    });
}

/**
 * Cancel all pending escalations for a notification (called when notification is read)
 */
async function cancelEscalation(notificationId: string) {
    try {
        const _result = await prisma.notificationDelivery.updateMany({
            where: {
                notificationId,
                status: { in: ["PENDING", "SCHEDULED", "PROCESSING"] },
            },
            data: {
                status: "CANCELLED",
                updatedAt: new Date(),
            },
        });
    } catch {
        // Error cancelling escalation
    }
}

/**
 * Schedule escalation deliveries for a notification
 * Called by the router when a notification uses ESCALATION strategy
 */
export async function scheduleEscalation(
    notificationId: string,
    channels: { email?: string; sms?: string }
) {
    const now = new Date();
    const createOperations = [];

    // Schedule SMS delivery (10 minutes after in-app)
    if (channels.sms) {
        createOperations.push(prisma.notificationDelivery.create({
            data: {
                notificationId,
                channel: "SMS",
                status: "SCHEDULED",
                scheduledFor: new Date(now.getTime() + ESCALATION_DELAYS.SMS),
                metadata: { phoneNumber: channels.sms },
            },
        }));
    }

    // Schedule EMAIL delivery (40 minutes after in-app)
    if (channels.email) {
        createOperations.push(prisma.notificationDelivery.create({
            data: {
                notificationId,
                channel: "EMAIL",
                status: "SCHEDULED",
                scheduledFor: new Date(now.getTime() + ESCALATION_DELAYS.EMAIL),
                metadata: { emailAddress: channels.email },
            },
        }));
    }

    if (createOperations.length > 0) {
        await prisma.$transaction(createOperations);
    }
}

/**
 * Consumer for notification read events
 * Cancels escalation when user reads the notification
 */
let readConsumer: Consumer | null = null;

/**
 * Performs start read event consumer operation.
 * @returns {Promise<void>} Description of return value
 */
async function startReadEventConsumer() {
    readConsumer = kafka.consumer({ groupId: "escalation-read-group" });

    await readConsumer.connect();
    await readConsumer.subscribe({ topic: "notification.read", fromBeginning: false });

    await readConsumer.run({
        eachMessage: async ({ topic: _topic, partition: _partition, message }) => {
            try {
                const isDuplicate = await ensureIdempotent(message.key);
                if (isDuplicate) {
                    return;
                }

                const value = message.value?.toString();
                if (!value) return;

                const event = JSON.parse(value);
                const { notificationId } = event;

                if (notificationId) {
                    await cancelEscalation(notificationId);
                }
            } catch {
                void 0;
            }
        },
    });
}

/**
 * Start the escalation worker
 * Runs periodic checks for scheduled deliveries
 */
let escalationTimeout: NodeJS.Timeout | null = null;
let shouldRunEscalation = true;

/**
 * Performs start escalation worker operation.
 * @returns {Promise<void>} Description of return value
 */
async function startEscalationWorker() {
    await startReadEventConsumer();

    // Process escalations every 30 seconds and store the handle
    const scheduleNextRun = () => {
        if (!shouldRunEscalation) return;
        escalationTimeout = setTimeout(async () => {
            await processEscalation();
            scheduleNextRun();
        }, 30 * 1000);
    };

    // Initial processing
    await processEscalation();
    scheduleNextRun();
}

// Start the worker
startEscalationWorker().catch((_error) => {
    process.exit(1);
});

// Handle graceful shutdown
process.on("SIGINT", async () => {
    // Clear the escalation interval
    shouldRunEscalation = false;
    if (escalationTimeout) {
        clearTimeout(escalationTimeout);
        escalationTimeout = null;
    }

    // Stop and disconnect Kafka consumer
    if (readConsumer) {
        try {
            await readConsumer.stop();
            await readConsumer.disconnect();
        } catch {
            // Error disconnecting read consumer
        }
    }

    // Disconnect Prisma
    await prisma.$disconnect();

    process.exit(0);
});

process.on("SIGTERM", async () => {
    // Clear the escalation interval
    shouldRunEscalation = false;
    if (escalationTimeout) {
        clearTimeout(escalationTimeout);
        escalationTimeout = null;
    }

    // Stop and disconnect Kafka consumer
    if (readConsumer) {
        try {
            await readConsumer.stop();
            await readConsumer.disconnect();
        } catch {
            // Error disconnecting read consumer
        }
    }

    // Disconnect Prisma
    await prisma.$disconnect();

    process.exit(0);
});
