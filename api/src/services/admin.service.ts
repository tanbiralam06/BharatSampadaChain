import { db } from '../db/client';
import { redis } from '../cache/redis';

export interface SystemHealth {
  status: 'healthy' | 'degraded';
  services: { postgres: string; redis: string; fabric: string };
  timestamp: string;
}

export interface SystemStats {
  totalCitizens: number;
  totalProperties: number;
  openFlags: number;
  redFlags: number;
}

export async function getHealth(): Promise<SystemHealth> {
  const [pgOk, redisOk] = await Promise.all([
    db.query('SELECT 1').then(() => true).catch(() => false),
    redis.ping().then(() => true).catch(() => false),
  ]);

  return {
    status: pgOk && redisOk ? 'healthy' : 'degraded',
    services: {
      postgres: pgOk ? 'up' : 'down',
      redis: redisOk ? 'up' : 'down',
      fabric: 'connected',
    },
    timestamp: new Date().toISOString(),
  };
}

export async function getStats(): Promise<SystemStats> {
  const safe = (r: PromiseSettledResult<{ rows: { count: string }[] }>) =>
    r.status === 'fulfilled' ? parseInt(r.value.rows[0]?.count ?? '0', 10) : 0;

  const results = await Promise.allSettled([
    db.query('SELECT COUNT(*) AS count FROM citizens'),
    db.query('SELECT COUNT(*) AS count FROM properties'),
    db.query("SELECT COUNT(*) AS count FROM anomaly_flags WHERE status = 'OPEN'"),
    db.query("SELECT COUNT(*) AS count FROM anomaly_flags WHERE severity = 'RED' AND status = 'OPEN'"),
  ]);

  return {
    totalCitizens:  safe(results[0] as PromiseSettledResult<{ rows: { count: string }[] }>),
    totalProperties: safe(results[1] as PromiseSettledResult<{ rows: { count: string }[] }>),
    openFlags:       safe(results[2] as PromiseSettledResult<{ rows: { count: string }[] }>),
    redFlags:        safe(results[3] as PromiseSettledResult<{ rows: { count: string }[] }>),
  };
}
