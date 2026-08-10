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

  // Check if already processed
  const exists = await redis.exists(redisKey);
  if (exists) {
    return true; // duplicate
  }

  // Mark as processed
  await redis.set(redisKey, "1", { EX: PROCESSED_TTL });
  return false; // not a duplicate
}
