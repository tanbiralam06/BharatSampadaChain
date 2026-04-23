import Redis from 'ioredis';
import { config } from '../config';

export const redis = new Redis(config.redis.url, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

redis.on('error', (err) => {
  // Log but don't crash — app works without cache
  console.warn('Redis connection error (non-fatal):', err.message);
});

export async function getCache<T>(key: string): Promise<T | null> {
  const val = await redis.get(key);
  return val ? (JSON.parse(val) as T) : null;
}

export async function setCache<T>(key: string, value: T, ttlSeconds: number = config.redis.ttl): Promise<void> {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
