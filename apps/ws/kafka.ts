import { Kafka, type EachMessagePayload } from "kafkajs";
import { NotificationChannel } from "@modheshwari/db";

import type { NotificationEvent } from "./types";
import { KAFKA_BROKER, NOTIFICATION_TOPIC, WS_CONSUMER_GROUP } from "./config";
import { pushToUser } from "./utils";
import { logger } from "./logger";

const KAFKA_ENABLED = !!KAFKA_BROKER || process.env.KAFKA_ENABLED === "true";

const logCreator =
    () =>
        ({ namespace, level, label: _label, log }: any) => {
            try {
                const lvl =
                    log && (log.level || log.levelName)
                        ? String(log.level || log.levelName).toUpperCase()
                        : String(level || "INFO").toUpperCase();

                const msgParts: any = { namespace };
                if (log && log.message) msgParts.message = log.message;
                if (log && log.error) msgParts.error = log.error;
                for (const k of ["groupId", "memberId", "clientId", "broker"]) {
                    if (log && (log as any)[k]) (msgParts as any)[k] = (log as any)[k];
                }

                let text: string;
                try {
                    text = msgParts.message
                        ? `${msgParts.message}`
                        : JSON.stringify(msgParts);
                } catch {
                    text = String(msgParts);
                }

                if (lvl.includes("ERROR"))
                    logger.error(text, msgParts.error || msgParts);
                else if (lvl.includes("WARN")) logger.warn(text, msgParts);
                else if (lvl.includes("DEBUG")) logger.debug(text, msgParts);
                else logger.info(text, msgParts);
            } catch {
                logger.info(String(log) || "kafkajs log", log);
            }
        };

export const kafka = KAFKA_ENABLED
    ? new Kafka({
        clientId: "modheshwari-ws",
        brokers: [KAFKA_BROKER],
        logCreator,
    })
    : null;

export const consumer = kafka?.consumer({ groupId: WS_CONSUMER_GROUP }) ?? null;

/**
 * Handle notification event from Kafka.
 */
async function handleNotificationEvent({ message }: EachMessagePayload) {
    const raw = message.value?.toString();
    if (!raw) return;

    let parsed: NotificationEvent | null = null;
    try {
        parsed = JSON.parse(raw) as NotificationEvent;
    } catch (err) {
        logger.error(
            "Failed to parse event",
            err instanceof Error ? err : String(err),
        );
        return;
    }

    if (!Array.isArray(parsed.recipientIds) || parsed.recipientIds.length === 0) {
        return;
    }

    if (!parsed.channels?.includes(NotificationChannel.IN_APP)) {
        return;
    }

    for (const recipientId of parsed.recipientIds) {
        pushToUser(recipientId, {
            type: "notification",
            notification: {
                eventId: parsed.eventId,
                message: parsed.message,
                type: parsed.type,
                subject: parsed.subject,
                priority: parsed.priority,
                timestamp: parsed.timestamp,
            },
        });
    }
}

/**
 * Start Kafka consumer for notifications.
 */
export async function startKafkaConsumer() {
    if (!consumer) {
        logger.info("Kafka disabled — skipping consumer (no KAFKA_BROKER set)");
        return;
    }
    await consumer.connect();
    await consumer.subscribe({ topic: NOTIFICATION_TOPIC, fromBeginning: false });
    await consumer.run({
        eachMessage: handleNotificationEvent,
    });
    logger.info(`Kafka consumer connected → ${NOTIFICATION_TOPIC}`);
}
