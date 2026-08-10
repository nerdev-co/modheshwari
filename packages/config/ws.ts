/**
 * Typed environment configuration for the WebSocket service.
 * All values are read from process.env after loadAppEnv() has been called.
 */

export const WS_PORT = Number(process.env.WS_PORT || "3002");

export const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const KAFKA_BROKER = process.env.KAFKA_BROKER || "localhost:9092";

export const NOTIFICATION_TOPIC = process.env.NOTIFICATION_TOPIC || "notification.events";

export const WS_CONSUMER_GROUP = process.env.WS_CONSUMER_GROUP || "notifications-ws";

export const MAX_MESSAGE_SIZE = 1024 * 1024; // 1MB
export const HEARTBEAT_INTERVAL = 30000; // 30s
export const CONNECTION_TIMEOUT = 60000; // 60s
export const RATE_LIMIT_WINDOW = 60000; // 1 minute
export const MAX_MESSAGES_PER_WINDOW = 100;
