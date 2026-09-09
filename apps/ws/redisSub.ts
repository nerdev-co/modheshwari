import type { RedisClientType } from 'redis';
import { createClient } from 'redis';

import { REDIS_URL } from './config';
import { pushToUser } from './utils';
import { logger } from './logger';

let sub: RedisClientType | null = null;

/**
 * Performs start redis subscriber operation.
 * Creates a DEDICATED Redis client for subscriptions so the shared
 * client pool is not put into pub/sub mode (which blocks all other
 * Redis commands).
 * @param {string} url - Description of url
 * @returns {Promise<void>} Description of return value
 */
export async function startRedisSubscriber(url = REDIS_URL) {
  if (!url) {
    logger.info('No REDIS_URL configured, skipping Redis subscriber');
    return;
  }

  sub = createClient({ url });
  sub.on('error', (err: Error) => {
    logger.error('Redis subscriber error', err.message);
  });
  await sub.connect();

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
 * Performs stop redis subscriber operation.
 * @returns {Promise<void>} Description of return value
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