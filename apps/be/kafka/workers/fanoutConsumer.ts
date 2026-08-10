import prisma from '@modheshwari/db';
import { createClient } from 'redis';

import { createConsumer, TOPICS, producer } from '../config';
import { processFanoutMessage } from './fanoutWorker';
import { ensureIdempotent } from '../../lib/kafkaIdempotency';

/**
 * Fanout consumer: subscribes to notification events and processes
 * messages that are fanout events (event-type: notification.fanout)
 */
export async function runFanoutConsumer() {
    const consumer = createConsumer('fanout-worker-group');
    let redis: any = null;
    const useCache = String(process.env.NOTIFICATION_CACHE || '').toLowerCase() === 'true';

    if (useCache) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        redis = createClient({ url: redisUrl });
        try {
            await redis.connect();
        } catch (e) {
            console.warn('Failed to connect to redis for notification cache, continuing without cache', e);
            redis = null;
        }
    }

    await consumer.connect();
    await consumer.subscribe({ topic: TOPICS.NOTIFICATION_EVENTS, fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ topic: _topic, partition: _partition, message }) => {
            try {
                const isDuplicate = await ensureIdempotent(message.key);
                if (isDuplicate) {
                    return;
                }

                const raw = message.value?.toString();
                if (!raw) return;

                const headers = message.headers || {};
                const eventType = headers['event-type'] ? headers['event-type'].toString() : undefined;

                const payload = JSON.parse(raw);

                // Only handle fanout events
                if (eventType !== 'notification.fanout' && !payload?.fanoutId) return;

                await processFanoutMessage({
                    prisma,
                    producer,
                    redis,
                    msg: {
                        fanoutId: payload.fanoutId,
                        initiatedBy: payload.initiatedBy,
                        recipientIds: payload.recipientIds || [],
                        channels: payload.channels || ['IN_APP'],
                        message: payload.message,
                        priority: payload.priority,
                    },
                });
            } catch (err) {
                console.error('Error processing fanout message:', err);
            }
        },
    });

    // keep redis client alive while consumer runs; on process exit attempt to disconnect
    process.on('SIGINT', async () => {
        try {
            if (redis) await redis.disconnect();
        } catch { void 0; }
        process.exit(0);
    });
}

// ES module-safe check to run when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runFanoutConsumer().catch((err) => {
        console.error('Fanout consumer failed to start:', err);
        process.exit(1);
    });
}

export default runFanoutConsumer;
