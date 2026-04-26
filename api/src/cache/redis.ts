import Redis from 'ioredis';
import { config } from '../config';

export const redis = new Redis(config.redis.url, {
  lazyConnect: true,
  maxRetriesPerRequest: 0,
  // Exponential backoff capped at 30 s; give up after 5 consecutive failures
  retryStrategy(times) {
    if (times > 5) return null; // stop retrying — app runs fine without cache
    return Math.min(times * 2000, 30_000);
  },
});

let _redisWarnedDown = false;
redis.on('error', (err) => {
  if (!_redisWarnedDown) {
    console.warn('Redis connection error (non-fatal):', err.message);
    console.warn('Redis unavailable — running without cache');
    _redisWarnedDown = true;
  }
});
redis.on('connect', () => { _redisWarnedDown = false; });

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
