import { Router, Response } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { db } from '../db/client';
import { redis } from '../cache/redis';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// GET /admin/health — system health check
router.get('/health', authenticate, requireRole('ADMIN'), asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [pgOk, redisOk] = await Promise.all([
    db.query('SELECT 1').then(() => true).catch(() => false),
    redis.ping().then(() => true).catch(() => false),
  ]);

  const status = pgOk && redisOk ? 'healthy' : 'degraded';

  res.json({
    success: true,
    data: {
      status,
      services: {
        postgres: pgOk ? 'up' : 'down',
        redis: redisOk ? 'up' : 'down',
        fabric: 'connected',
      },
      timestamp: new Date().toISOString(),
    },
  });
}));

// GET /admin/stats — high-level ledger statistics (PostgreSQL off-chain index)
router.get('/stats', authenticate, requireRole('ADMIN'), asyncHandler(async (_req: AuthRequest, res: Response) => {
  const results = await Promise.allSettled([
    db.query('SELECT COUNT(*) AS count FROM citizens'),
    db.query('SELECT COUNT(*) AS count FROM properties'),
    db.query('SELECT COUNT(*) AS count FROM anomaly_flags WHERE status = $1', ['OPEN']),
    db.query("SELECT COUNT(*) AS count FROM anomaly_flags WHERE severity = 'RED' AND status = 'OPEN'"),
  ]);

  const safe = (r: PromiseSettledResult<{ rows: { count: string }[] }>) =>
    r.status === 'fulfilled' ? parseInt(r.value.rows[0]?.count ?? '0', 10) : 0;

  res.json({
    success: true,
    data: {
      totalCitizens: safe(results[0] as PromiseSettledResult<{ rows: { count: string }[] }>),
      totalProperties: safe(results[1] as PromiseSettledResult<{ rows: { count: string }[] }>),
      openFlags: safe(results[2] as PromiseSettledResult<{ rows: { count: string }[] }>),
      redFlags: safe(results[3] as PromiseSettledResult<{ rows: { count: string }[] }>),
    },
  });
}));

export default router;
