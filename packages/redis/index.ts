import { createClient } from 'redis';
import type { RedisClientType } from 'redis';
import { REDIS_URL } from "@modheshwari/config/be";

let client: RedisClientType | null = null;
let connectFailed = false;

/**
 * Get Redis client. Returns null if Redis is unavailable (non-fatal for dev).
 */
export async function getRedisClient(url?: string): Promise<RedisClientType> {
  if (client) return client;
  if (connectFailed) return null as any;

  const redisUrl = url || REDIS_URL;
  client = createClient({ 
    url: redisUrl, 
    socket: { 
      reconnectStrategy: (retries) => {
        if (retries > 5) {
          connectFailed = true;
          return new Error("Max Redis reconnection attempts reached");
        }
        return Math.min(retries * 200, 5000);
      }
    } 
  });
  client.on('error', (err: Error) => {
    console.error('Redis client error', err instanceof Error ? err.message : String(err));
  });

  try {
    await client.connect();
  } catch (err) {
    console.warn('Redis not available — continuing without cache (dev)', err instanceof Error ? err.message : String(err));
    client = null;
    connectFailed = true;
    return null as any;
  }

  return client;
}

/**
 * Quit Redis client.
 */
export async function quitRedisClient() {
  try {
    if (client) {
      await client.quit();
      client = null;
      connectFailed = false;
    }
  } catch (err) {
    console.warn('Failed to quit redis client', err);
  }
}

export default getRedisClient;
