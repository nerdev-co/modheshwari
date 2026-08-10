import prisma from "@modheshwari/db";
import { OUTBOX_BATCH_SIZE, OUTBOX_POLL_INTERVAL_MS, OUTBOX_LOCK_TTL_MS } from "@modheshwari/config/be";

import { producer } from "../config";
import { indexUser, deleteUser, indexEvent, deleteEvent } from "../../lib/elasticIndexer";
import getRedisClient from "../../lib/redisClient";
import { logger } from "../../lib/logger";
import { errorCounter, outboxPendingEvents, outboxRetryCount } from "../../lib/metrics";

const BATCH_SIZE = OUTBOX_BATCH_SIZE;
const POLL_INTERVAL_MS = OUTBOX_POLL_INTERVAL_MS;
const ES_TOPIC = "elasticsearch.indexing";
const LOCK_TTL_MS = OUTBOX_LOCK_TTL_MS;
const LOCK_KEY = "outbox:relay:lock";
const INSTANCE_ID = `${process.pid}-${Math.random().toString(36).slice(2, 9)}`;

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

async function acquireLock() {
  const redis = await getRedisClient();
  const acquired = await redis.set(LOCK_KEY, INSTANCE_ID, {
    NX: true,
    EX: Math.ceil(LOCK_TTL_MS / 1000),
  });
  return acquired === "OK";
}

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

async function markPublished(id: string) {
  await prisma.outboxEvent.updateMany({
    where: { id, publishedAt: null },
    data: { publishedAt: new Date() },
  });
}

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
    }
  }

  return processed;
}

let running = true;

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
