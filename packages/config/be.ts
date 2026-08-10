/**
 * Typed environment configuration for the backend API.
 * All values are read from process.env after loadAppEnv() has been called.
 */

export const PORT = Number(process.env.PORT || "3001");

export const DATABASE_URL = process.env.DATABASE_URL || "";

export const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const KAFKA_BROKER = process.env.KAFKA_BROKER || "localhost:9092";

export const JWT_SECRET = process.env.JWT_SECRET || "changeme";

export const OUTBOX_BATCH_SIZE = Number(process.env.OUTBOX_BATCH_SIZE || "50");
export const OUTBOX_POLL_INTERVAL_MS = Number(process.env.OUTBOX_POLL_INTERVAL_MS || "1000");
export const OUTBOX_LOCK_TTL_MS = Number(process.env.OUTBOX_LOCK_TTL_MS || "5000");

export const ES_NODE = process.env.ES_NODE || "http://localhost:9200";

export const NOTIFICATION_PREVIEW_TTL_SECONDS = Number(process.env.NOTIFICATION_PREVIEW_TTL_SECONDS || "60");

export const PROFILE_TTL_SECONDS = Number(process.env.PROFILE_TTL_SECONDS || "300");

export const ROLE_CHANGE_RATE_LIMIT = Number(process.env.ROLE_CHANGE_RATE_LIMIT || "5");

export const NOTIFICATION_DRAIN_SCAN_COUNT = Number(process.env.NOTIFICATION_DRAIN_SCAN_COUNT || "100");
export const NOTIFICATION_DRAIN_INTERVAL_MS = Number(process.env.NOTIFICATION_DRAIN_INTERVAL_MS || String(1000 * 60 * 5));

export const NOTIFICATION_DLQ_RETRY_BATCH = Number(process.env.NOTIFICATION_DLQ_RETRY_BATCH || "50");
export const NOTIFICATION_DLQ_MAX_ATTEMPTS = Number(process.env.NOTIFICATION_DLQ_MAX_ATTEMPTS || "5");
export const NOTIFICATION_DLQ_BASE_DELAY_MS = Number(process.env.NOTIFICATION_DLQ_BASE_DELAY_MS || String(60 * 1000));
export const NOTIFICATION_DLQ_RETRY_INTERVAL_MS = Number(process.env.NOTIFICATION_DLQ_RETRY_INTERVAL_MS || String(30 * 1000));

export const OUTBOX_MAX_ATTEMPTS = Number(process.env.OUTBOX_MAX_ATTEMPTS || "10");

export const ES_RECONCILIATION_INTERVAL_MS = Number(process.env.ES_RECONCILIATION_INTERVAL_MS || String(1000 * 60 * 60));
