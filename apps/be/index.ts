/**
 * Backend Server Entry Point
 * 
 * Modular API server for Modheshwari community management platform.
 * 
 * Architecture:
 * - server/handlers.ts: Re-exports all route handlers
 * - server/authRoutes.ts: Authentication routes (signup/login)
 * - server/staticRoutes.ts: Fixed-path API routes
 * - server/parameterizedRoutes.ts: Dynamic routes with params
 * - server/router.ts: Main request routing logic
 */

import { serve } from "bun";
import { loadAppEnv } from "@modheshwari/config/loadEnv";
import prisma from "@modheshwari/db";

import { router } from "./server/router";
import { logger } from "./lib/logger";
import "./lib/metrics";
import startNotificationDrain from "./kafka/workers/notificationDrain";
import startDLQRetryWorker from "./kafka/workers/notificationDLQ";
import startOutboxRelay from "./kafka/workers/outboxRelay";
import startEsReconciliation from "./kafka/workers/esReconciliation";

loadAppEnv();

/**
 * Performs register prisma hooks operation.
 * @returns {Promise<void>} Description of return value
 */
async function registerPrismaHooks() {
    try {
        const { registerPrismaIndexHooks } = await import("./lib/prismaIndexHooks");
        registerPrismaIndexHooks();
        logger.info('Prisma index hooks registered');
    } catch (err) {
        logger.warn('Prisma index hooks not registered (elastic client may be unavailable)', err);
    }
}

registerPrismaHooks();

const PORT = parseInt(process.env.PORT || "3001");

// Start server
serve({
    port: PORT,
    fetch: router,
});

logger.info(`Server running on http://localhost:${PORT}`);

// Start background workers after server is up (graceful if Redis/Kafka unavailable)
let drainHandle: { stop?: () => void } | null = null;
let dlqHandle: { stop?: () => void } | null = null;
let outboxHandle: { stop?: () => void } | null = null;
let esReconHandle: { stop?: () => void } | null = null;

try {
  drainHandle = startNotificationDrain();
} catch (err) {
  logger.warn('Notification drain worker not started (Redis may be unavailable)', err);
}

try {
  dlqHandle = startDLQRetryWorker();
} catch (err) {
  logger.warn('DLQ retry worker not started (Redis may be unavailable)', err);
}

try {
  outboxHandle = startOutboxRelay();
} catch (err) {
  logger.warn('Outbox relay worker not started (Kafka may be unavailable)', err);
}

try {
  esReconHandle = startEsReconciliation();
} catch (err) {
  logger.warn('ES reconciliation worker not started', err);
}

// Graceful shutdown
/**
 * Performs shutdown operation.
 * @param {string} signal - Description of signal
 * @returns {Promise<void>} Description of return value
 */
async function shutdown(signal: string) {
    logger.info(`Shutting down gracefully (${signal})`);
    try {
        drainHandle?.stop?.();
        dlqHandle?.stop?.();
        outboxHandle?.stop?.();
        esReconHandle?.stop?.();
        await prisma.$disconnect();
    } catch (e) {
        logger.warn('Error during shutdown', e);
    }
    process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Expose default metrics and ensure metrics collection started
try {
    // metrics import already calls collectDefaultMetrics
    logger.info('Prometheus metrics initialized');
} catch (err) {
    logger.warn('Failed to initialize Prometheus metrics', err);
}

// Keep process alive
await new Promise(() => { });
