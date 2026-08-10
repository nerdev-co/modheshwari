import prisma from "@modheshwari/db";
import { indexUser, indexEvent } from "../../lib/elasticIndexer";

import { logger } from "../../lib/logger";
import { elasticsearchReconciliationCount } from "../../lib/metrics";

const RECONCILIATION_INTERVAL_MS = Number(process.env.ES_RECONCILIATION_INTERVAL_MS || "1000 * 60 * 60"); // 1 hour
const BATCH_SIZE = 500;

/**
 * Performs reconcile users operation.
 * @returns {Promise<number>} Description of return value
 */
async function reconcileUsers() {
  const lastReconciledAt = new Date(Date.now() - RECONCILIATION_INTERVAL_MS);

  const users = await prisma.user.findMany({
    where: {
      updatedAt: { gt: lastReconciledAt },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profile: {
        select: {
          phone: true,
          gotra: true,
          profession: true,
          bloodGroup: true,
          location: true,
          locationLat: true,
          locationLng: true,
        },
      },
    },
    take: BATCH_SIZE,
  });

  for (const user of users) {
    try {
      await indexUser({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.profile?.phone ?? null,
        role: user.role,
        profile: {
          gotra: user.profile?.gotra ?? null,
          profession: user.profile?.profession ?? null,
          bloodGroup: user.profile?.bloodGroup ?? null,
          location: user.profile?.location ?? null,
        },
        locationLat: user.profile?.locationLat ?? null,
        locationLng: user.profile?.locationLng ?? null,
      });
    } catch (err) {
      logger.error("ES reconciliation failed for user", {
        userId: user.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return users.length;
}

/**
 * Performs reconcile events operation.
 * @returns {Promise<number>} Description of return value
 */
async function reconcileEvents() {
  const lastReconciledAt = new Date(Date.now() - RECONCILIATION_INTERVAL_MS);

  const events = await prisma.event.findMany({
    where: {
      updatedAt: { gt: lastReconciledAt },
    },
    select: {
      id: true,
      name: true,
      description: true,
      date: true,
      venue: true,
      status: true,
    },
    take: BATCH_SIZE,
  });

  for (const ev of events) {
    try {
      await indexEvent({
        id: ev.id,
        name: ev.name,
        description: ev.description,
        date: ev.date,
        venue: ev.venue,
        status: ev.status,
      });
    } catch (err) {
      logger.error("ES reconciliation failed for event", {
        eventId: ev.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return events.length;
}

/**
 * Performs run es reconciliation operation.
 * @returns {Promise<void>} Description of return value
 */
export async function runEsReconciliation() {
  try {
    const userCount = await reconcileUsers();
    const eventCount = await reconcileEvents();

    elasticsearchReconciliationCount.inc(userCount + eventCount);

    logger.info("ES reconciliation completed", {
      users: userCount,
      events: eventCount,
    });
  } catch (err) {
    logger.error("ES reconciliation failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

let running = true;

/**
 * Performs start es reconciliation operation.
 * @param {number} intervalMs - Description of intervalMs
 * @returns {{ stop(): void; }} Description of return value
 */
export function startEsReconciliation(intervalMs = RECONCILIATION_INTERVAL_MS) {
  async function tick() {
    if (!running) return;
    try {
      await runEsReconciliation();
    } catch (err) {
      logger.error("ES reconciliation tick failed", {
        error: err instanceof Error ? err.message : String(err),
      });
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

export default startEsReconciliation;
