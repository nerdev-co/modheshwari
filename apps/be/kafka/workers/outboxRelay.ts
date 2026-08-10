import prisma from "@modheshwari/db";
import { OUTBOX_BATCH_SIZE, OUTBOX_POLL_INTERVAL_MS, OUTBOX_LOCK_TTL_MS, OUTBOX_MAX_ATTEMPTS } from "@modheshwari/config/be";

import { producer } from "../config";
import { indexUser, deleteUser, indexEvent, deleteEvent } from "../../lib/elasticIndexer";
import getRedisClient from "../../lib/redisClient";
import { logger } from "../../lib/logger";
import { errorCounter, outboxPendingEvents, outboxRetryCount } from "../../lib/metrics";

const BATCH_SIZE = OUTBOX_BATCH_SIZE;
const POLL_INTERVAL_MS = OUTBOX_POLL_INTERVAL_MS;
const ES_TOPIC = "elasticsearch.indexing";
const LOCK_TTL_MS = OUTBOX_LOCK_TTL_MS;
const MAX_ATTEMPTS = OUTBOX_MAX_ATTEMPTS;
const LOCK_KEY = "outbox:relay:lock";
const INSTANCE_ID = `${process.pid}-${Math.random().toString(36).slice(2, 9)}`;

/**
 * Performs claim pending events operation.
 * @returns {Promise<{ payload: Record<string, unknown>; id: string; createdAt: Date; eventType: string; aggregateType: string; aggregateId: string; topic: string; attempts: number; lastError: string; }[]>} Description of return value
 */
async function claimPendingEvents() {
  const events = await prisma.outboxEvent.findMany({
    where: { publishedAt: null },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
    select: {
      id: true,
      eventType: true,
      aggregateType: true,
      aggregateId: true,
      payload: true,
      topic: true,
      attempts: true,
      lastError: true,
      createdAt: true,
    },
  });

  if (events.length === 0) return [];

  return events.map((e) => ({
    ...e,
    payload: (e.payload ?? {}) as Record<string, unknown>,
  }));
}

/**
 * Performs acquire lock operation.
 * @returns {Promise<boolean>} Description of return value
 */
async function acquireLock() {
  const redis = await getRedisClient();
  const acquired = await redis.set(LOCK_KEY, INSTANCE_ID, {
    NX: true,
    EX: Math.ceil(LOCK_TTL_MS / 1000),
  });
  return acquired === "OK";
}

/**
 * Performs release lock operation.
 * @returns {Promise<void>} Description of return value
 */
async function releaseLock() {
  try {
    const redis = await getRedisClient();
    const current = await redis.get(LOCK_KEY);
    if (current === INSTANCE_ID) {
      await redis.del(LOCK_KEY);
    }
  } catch (err) {
    logger.debug("Outbox lock release failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Performs publish to kafka operation.
 * @param {{ id: string; topic: string; payload: Record<string, unknown>; }} event - Description of event
 * @returns {Promise<void>} Description of return value
 */
async function publishToKafka(event: {
  id: string;
  topic: string;
  payload: Record<string, unknown>;
}) {
  await producer.send({
    topic: event.topic,
    messages: [
      {
        key: event.id,
        value: JSON.stringify({
          ...event.payload,
          _outboxId: event.id,
        }),
      },
    ],
  });
}

/**
 * Performs handle elasticsearch indexing operation.
 * @param {{ id: string; eventType: string; payload: Record<string, unknown>; }} event - Description of event
 * @returns {Promise<void>} Description of return value
 */
async function handleElasticsearchIndexing(event: {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
}) {
  const { eventType, payload } = event;

  try {
    if (eventType === "user.created" || eventType === "user.updated") {
      await indexUser(payload);
    } else if (eventType === "user.deleted") {
      await deleteUser(String(payload.id || payload.aggregateId || ""));
    } else if (eventType === "event.created" || eventType === "event.updated") {
      await indexEvent(payload);
    } else if (eventType === "event.deleted") {
      await deleteEvent(String(payload.id || payload.aggregateId || ""));
    }
  } catch (err) {
    logger.error("Elasticsearch indexing failed", {
      outboxId: event.id,
      eventType,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

/**
 * Performs mark published operation.
 * @param {string} id - Description of id
 * @returns {Promise<void>} Description of return value
 */
async function markPublished(id: string) {
  await prisma.outboxEvent.updateMany({
    where: { id, publishedAt: null },
    data: { publishedAt: new Date() },
  });
}

/**
 * Performs increment attempts operation.
 * @param {string} id - Description of id
 * @param {string} error - Description of error
 * @returns {Promise<void>} Description of return value
 */
async function incrementAttempts(id: string, error: string) {
  await prisma.outboxEvent.updateMany({
    where: { id },
    data: {
      attempts: { increment: 1 },
      lastError: error.length > 500 ? error.slice(0, 500) : error,
    },
  });
  outboxRetryCount.inc(1);
}

/**
 * Performs move to dead letter operation.
 * @param {{ id: string; eventType: string; aggregateType: string; aggregateId: string; payload: Record<string, unknown>; topic: string; attempts: number; lastError: string; createdAt: Date; }} event - Description of event
 * @param {string} reason - Description of reason
 * @returns {Promise<void>} Description of return value
 */
async function moveToDeadLetter(event: {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  topic: string;
  attempts: number;
  lastError: string | null;
  createdAt: Date;
}, reason: string) {
  await prisma.outboxEventDeadLetter.create({
    data: {
      eventType: event.eventType,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      payload: JSON.parse(JSON.stringify(event.payload)),
      topic: event.topic,
      attempts: event.attempts,
      lastError: event.lastError ?? undefined,
      publishedAt: null,
      reason,
    },
  });

  await prisma.outboxEvent.deleteMany({
    where: { id: event.id },
  });

  logger.warn("Outbox event moved to dead letter", {
    outboxId: event.id,
    topic: event.topic,
    attempts: event.attempts,
    reason,
  });
  errorCounter.inc({ type: "outbox_dlq" }, 1);
}

/**
 * Performs process outbox once operation.
 * @returns {Promise<number>} Description of return value
 */
export async function processOutboxOnce() {
  const events = await claimPendingEvents();
  if (events.length === 0) return 0;

  let processed = 0;

  for (const event of events) {
    try {
      if (event.topic === ES_TOPIC) {
        await handleElasticsearchIndexing(event);
      } else {
        await publishToKafka(event);
      }
      await markPublished(event.id);
      processed++;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error("Outbox processing failed", {
        outboxId: event.id,
        topic: event.topic,
        error: errorMsg,
      });
      errorCounter.inc({ type: "outbox_publish_failure" }, 1);
      await incrementAttempts(event.id, errorMsg);

      if (event.attempts + 1 >= MAX_ATTEMPTS) {
        await moveToDeadLetter(event, `Max attempts (${MAX_ATTEMPTS}) exceeded`);
      }
    }
  }

  return processed;
}

let running = true;

/**
 * Performs start outbox relay operation.
 * @param {number} intervalMs - Description of intervalMs
 * @returns {{ stop(): void; }} Description of return value
 */
export function startOutboxRelay(intervalMs = POLL_INTERVAL_MS) {
  async function tick() {
    if (!running) return;

    let locked = false;
    try {
      locked = await acquireLock();
      if (!locked) {
        return;
      }

      await processOutboxOnce();
    } catch (err) {
      logger.error("Outbox relay tick failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      errorCounter.inc({ type: "outbox_relay_failure" }, 1);
    } finally {
      if (locked) {
        await releaseLock();
      }
    }

    if (running) setTimeout(tick, intervalMs);
  }

  const updateMetrics = async () => {
    if (!running) return;
    try {
      const pendingCount = await prisma.outboxEvent.count({
        where: { publishedAt: null },
      });
      outboxPendingEvents.set(pendingCount);
    } catch {
      // metrics update failure is non-critical
    }
    if (running) setTimeout(updateMetrics, 5000);
  };

  setTimeout(tick, 0);
  setTimeout(updateMetrics, 0);

  return {
    stop() {
      running = false;
    },
  };
}

export default startOutboxRelay;
