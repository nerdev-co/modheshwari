import type { RedisClientType } from 'redis';
import prisma from '@modheshwari/db';
import { NOTIFICATION_DLQ_RETRY_BATCH, NOTIFICATION_DLQ_MAX_ATTEMPTS, NOTIFICATION_DLQ_BASE_DELAY_MS, NOTIFICATION_DLQ_RETRY_INTERVAL_MS } from "@modheshwari/config/be";

import getRedisClient from '../../lib/redisClient';
import { logger } from '../../lib/logger';
import { notificationDlqSize, errorCounter } from '../../lib/metrics';

const DLQ_KEY = 'notifications:dlq';
const SCHEDULED_ZSET = 'notifications:dlq:scheduled';
const ALERT_LIST = 'notifications:alerts';
const BATCH_SIZE = NOTIFICATION_DLQ_RETRY_BATCH;
const MAX_ATTEMPTS = NOTIFICATION_DLQ_MAX_ATTEMPTS;
const BASE_DELAY_MS = NOTIFICATION_DLQ_BASE_DELAY_MS;

/**
 * Performs parse entry operation.
 * @param {string} raw - Description of raw
 * @returns {Promise<any>} Description of return value
 */
async function parseEntry(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Performs move due scheduled to dlq operation.
 * @param {import("/Users/nalindalal/modheshwari/node_modules/redis/dist/index").RedisClientType} client - Description of client
 * @returns {Promise<void>} Description of return value
 */
async function moveDueScheduledToDlq(client: RedisClientType) {
  const now = Date.now();
  try {
    const due = await client.zRangeByScore(SCHEDULED_ZSET, 0, String(now), { LIMIT: { offset: 0, count: 1000 } });
    if (!due || due.length === 0) return;
    for (const item of due) {
      try {
        // remove specific item (may be duplicated if concurrent)
        await client.zRem(SCHEDULED_ZSET, item);
        await client.rPush(DLQ_KEY, item);
      } catch (e) {
        logger.warn('Failed moving scheduled DLQ item to DLQ list', { error: e instanceof Error ? e.message : String(e) });
      }
    }
  } catch (err) {
    logger.warn('Failed to move scheduled items', { error: err instanceof Error ? err.message : String(err) });
  }
}

/**
 * Performs process dlq once operation.
 * @param {import("/Users/nalindalal/modheshwari/node_modules/redis/dist/index").RedisClientType} client - Description of client
 * @returns {Promise<number>} Description of return value
 */
export async function processDlqOnce(client?: RedisClientType) {
  const redis = client || (await getRedisClient());
  // first move any scheduled due items
  await moveDueScheduledToDlq(redis);

  // update gauge
  try {
    const len = await redis.lLen(DLQ_KEY);
    const scheduled = await redis.zCard(SCHEDULED_ZSET);
    notificationDlqSize.set(len + scheduled);
  } catch (e) {
    logger.warn('Failed to update DLQ gauge', { error: e instanceof Error ? e.message : String(e) });
  }

  let processed = 0;
  for (let i = 0; i < BATCH_SIZE; i++) {
    const raw = await redis.lPop(DLQ_KEY);
    if (!raw) break;
    processed++;
    const entry = await parseEntry(raw);
    if (!entry || !entry.item) {
      logger.warn('Invalid DLQ entry, moving to alert list', { raw });
      await redis.rPush(ALERT_LIST, raw);
      continue;
    }

    const attempts = typeof entry.attempts === 'number' ? entry.attempts : 0;
    try {
      const p = entry.item;
      // Attempt to persist as single notification
      await prisma.notification.create({ data: {
        userId: p.userId,
        type: p.type || 'GENERIC',
        message: p.message || p.body || p.title || '',
        createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        fanoutId: p.fanoutId || null,
      }});
      // success
    } catch (dbErr) {
      // on failure, decide retry vs alert
      const nextAttempts = attempts + 1;
      if (nextAttempts >= MAX_ATTEMPTS) {
        logger.error('DLQ item exceeded max attempts; moving to alert list', { attempts: nextAttempts, raw, error: dbErr instanceof Error ? dbErr.message : String(dbErr) });
        errorCounter.inc({ type: 'notification_dlq_poison' }, 1);
        try {
          await redis.rPush(ALERT_LIST, JSON.stringify({ raw, attempts: nextAttempts, error: String(dbErr), movedAt: new Date().toISOString() }));
        } catch (e) {
          logger.warn('Failed to push to alert list', { error: e instanceof Error ? e.message : String(e) });
        }
        continue;
      }

      // schedule retry with exponential backoff
      const delay = BASE_DELAY_MS * Math.pow(2, attempts);
      const when = Date.now() + delay;
      const newEntry = JSON.stringify({ item: entry.item, attempts: nextAttempts, error: String(dbErr), lastErrorAt: new Date().toISOString() });
      try {
        await redis.zAdd(SCHEDULED_ZSET, [{ score: when, value: newEntry }]);
      } catch (e) {
        logger.warn('Failed to schedule DLQ retry; requeuing immediately', { error: e instanceof Error ? e.message : String(e) });
        try {
          await redis.rPush(DLQ_KEY, newEntry);
        } catch (ee) {
          logger.error('Failed to requeue DLQ item after scheduling failure', { error: ee instanceof Error ? ee.message : String(ee) });
        }
      }
    }
  }

  // refresh gauge after processing
  try {
    const lenAfter = await redis.lLen(DLQ_KEY);
    const scheduledAfter = await redis.zCard(SCHEDULED_ZSET);
    notificationDlqSize.set(lenAfter + scheduledAfter);
  } catch (e) {
    logger.warn('Failed to update DLQ gauge after processing', { error: e instanceof Error ? e.message : String(e) });
  }

  return processed;
}

/**
 * Performs start d l q retry worker operation.
 * @param {number} intervalMs - Description of intervalMs
 * @returns {{ stop(): void; }} Description of return value
 */
export function startDLQRetryWorker(intervalMs = NOTIFICATION_DLQ_RETRY_INTERVAL_MS) {
  let running = true;
  const redisPromise = getRedisClient();

  async function tick() {
    if (!running) return;
    const redis = await redisPromise;
    try {
      await processDlqOnce(redis);
    } catch (err) {
      logger.error('DLQ retry tick failed', { error: err instanceof Error ? err.message : String(err) });
      errorCounter.inc({ type: 'notification_dlq_retry' }, 1);
    }
    if (running) setTimeout(tick, intervalMs);
  }

  setTimeout(tick, 0);

  return {
    stop() {
      running = false;
    },
  };
}

export default startDLQRetryWorker;
