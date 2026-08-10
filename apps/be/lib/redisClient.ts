import { createClient } from 'redis';
import type { RedisClientType } from 'redis';
import { REDIS_URL } from "@modheshwari/config/be";

let client: RedisClientType | null = null;

/**
 * Performs get redis client operation.
 * @param {string} url - Description of url
 * @returns {Promise<import("/Users/nalindalal/modheshwari/node_modules/redis/dist/index").RedisClientType>} Description of return value
 */
export async function getRedisClient(url?: string): Promise<RedisClientType> {
  if (client) return client;
  const redisUrl = url || REDIS_URL;
  client = createClient({ 
    url: redisUrl, 
    socket: { 
      reconnectStrategy: (retries) => {
        if (retries > 10) return new Error("Max Redis reconnection attempts reached");
        return Math.min(retries * 200, 5000);
      }
    } 
  });
  client.on('error', (err: Error) => {
    console.error('Redis client error', err instanceof Error ? err.message : String(err));
  });
  await client.connect();
  return client;
}

/**
 * Performs quit redis client operation.
 * @returns {Promise<void>} Description of return value
 */
export async function quitRedisClient() {
  try {
    if (client) {
      await client.quit();
      client = null;
    }
  } catch (err) {
    console.warn('Failed to quit redis client', err);
  }
}

export default getRedisClient;
