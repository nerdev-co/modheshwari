import type { RedisClientType } from 'redis';
import { createClient } from 'redis';

import { REDIS_URL } from './config';
import { pushToUser } from './utils';
import { logger } from './logger';

let sub: RedisClientType | null = null;

/**
 * Start Redis subscriber for in-app notifications.
 * Fails gracefully if Redis is unavailable.
 */
export async function startRedisSubscriber(url = REDIS_URL) {
  if (!url) {
    logger.info('No REDIS_URL configured, skipping Redis subscriber');
    return;
  }

  sub = createClient({ url, socket: { reconnectStrategy: false } });
  sub.on('error', (err: Error) => {
    logger.warn('Redis subscriber error (non-fatal)', err.message || 'connection failed');
  });

  try {
    await sub.connect();
  } catch (err) {
    logger.warn(
      'Redis subscriber failed to connect — continuing without Redis',
      err instanceof Error ? err.message : String(err),
    );
    sub = null;
    return;
  }

  // subscribe to pattern inapp:* for user-specific channels
  await sub.pSubscribe('inapp:*', (message: string, _channel: string) => {
    try {
      const parsed = JSON.parse(message);
      const recipientId = parsed.recipientId;
      const notification = parsed.notification;
      if (recipientId) pushToUser(recipientId, { type: 'notification', notification });
    } catch (err) {
      logger.error('Failed to handle redis message', err instanceof Error ? err : String(err));
    }
  });

  logger.info('Redis in-app subscriber started');
}

/**
 * Stop Redis subscriber.
 */
export async function stopRedisSubscriber() {
  try {
    if (sub) {
      await sub.quit();
      sub = null;
    }
  } catch (err) {
    logger.warn('Failed to stop Redis subscriber', err instanceof Error ? err : String(err));
  }
}

export default startRedisSubscriber;
