import type { RedisClientType } from 'redis';

import { createConsumer, TOPICS } from '../config';
import getRedisClient from '@modheshwari/redis';
import { ensureIdempotent } from '../../lib/kafkaIdempotency';

interface NotificationEvent {
    eventId?: string;
    fanoutId?: string;
    recipientIds: string[];
    channels: string[];
    message: any;
}

// Publish IN_APP notifications to Redis so WebSocket servers (clustered) can pick them up
/**
 * Performs run in app worker operation.
 * @param {string} redisUrl - Description of redisUrl
 * @returns {Promise<void>} Description of return value
 */
export async function runInAppWorker() {
    const consumer = createConsumer('in-app-worker-group');
    const redis: RedisClientType = await getRedisClient();
    await consumer.connect();
    await consumer.subscribe({ topic: TOPICS.NOTIFICATION_EVENTS, fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ message }) => {
            try {
                const isDuplicate = await ensureIdempotent(message.key);
                if (isDuplicate) {
                    return;
                }

                const raw = message.value?.toString();
                if (!raw) return;
                const payload = JSON.parse(raw) as NotificationEvent;

                if (!payload.channels || !payload.recipientIds) return;

                if (!payload.channels.includes('IN_APP')) return; // only handle in-app here

                // publish per-recipient to redis channel, unless a preview was recently sent
                for (const rid of payload.recipientIds) {
                    try {
                        const previewKey = `notification_preview:${rid}:${payload.eventId}`;
                        const exists = payload.eventId ? await redis.exists(previewKey) : 0;
                        if (exists) {
                            // preview already sent recently for this recipient+eventId; skip to avoid duplicate
                            continue;
                        }

                        const payloadMsg = JSON.stringify({ recipientId: rid, notification: payload });
                        // channel: inapp:{userId}
                        await redis.publish(`inapp:${rid}`, payloadMsg);
                    } catch (e) {
                        console.error('Failed to publish in-app message for', rid, e);
                    }
                }
            } catch (err) {
                console.error('in-app worker error', err);
            }
        },
    });
}

if (import.meta.url === `file://${process.argv[1]}`) {
    runInAppWorker().catch((e) => {
        console.error('in-app worker failed', e);
        process.exit(1);
    });
}

export default runInAppWorker;
