import getRedisClient from "@modheshwari/redis";

const PROCESSED_PREFIX = "kafka:processed:";
const PROCESSED_TTL = 24 * 60 * 60; // 24 hours

/**
 * Checks if a Kafka message was already processed and marks it as processed.
 * Returns true if the message is a duplicate (already processed).
 */
export async function ensureIdempotent(messageKey: string | Buffer | null | undefined): Promise<boolean> {
  if (!messageKey) return false;

  const key = typeof messageKey === "string" ? messageKey : messageKey.toString();
  if (!key) return false;

  const redis = await getRedisClient();
  const redisKey = `${PROCESSED_PREFIX}${key}`;

  // SET NX (set-if-not-exists) is atomic — no TOCTOU race.
  // Returns "OK" if the key was set (new message), null if it already existed (duplicate).
  const result = await redis.set(redisKey, "1", { EX: PROCESSED_TTL, NX: true });
  return result === null; // null means key already existed → duplicate
}
