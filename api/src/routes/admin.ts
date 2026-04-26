import crypto from 'crypto';
import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { db, queryOne } from '../db/client';
import { redis } from '../cache/redis';
import { asyncHandler } from '../utils/asyncHandler';
import { getAllPermissions, updatePermission } from '../services/permission.service';

const OFFICER_ROLES = ['IT_DEPT', 'ED', 'CBI', 'COURT', 'BANK'] as const;

const CreateOfficerSchema = z.object({
  name:     z.string().min(2).max(200),
  login_id: z.string().email('login_id must be a valid email address'),
  role:     z.enum(OFFICER_ROLES),
  password: z.string().min(8),
});

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

// POST /admin/officers — ADMIN creates any officer role; agency officer creates own role only
router.post('/officers', authenticate, requireRole('ADMIN', 'IT_DEPT', 'ED', 'CBI', 'COURT', 'BANK'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = CreateOfficerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }

  const { name, login_id, role, password } = parsed.data;
  const callerRole = req.user!.role;

  if (callerRole !== 'ADMIN' && callerRole !== role) {
    res.status(403).json({ success: false, error: 'You can only create officers in your own agency' });
    return;
  }

  const subject_hash = crypto.createHash('sha256').update(login_id).digest('hex');
  const password_hash = await bcrypt.hash(password, 10);

  try {
    const now = new Date().toISOString();
    await db.query(
      'INSERT INTO bsc_users (subject_hash, login_id, name, role, password_hash) VALUES ($1, $2, $3, $4, $5)',
      [subject_hash, login_id, name, role, password_hash]
    );
    res.status(201).json({
      success: true,
      data: { subject_hash, login_id, name, role, is_active: true, created_at: now },
    });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ success: false, error: 'An officer with this email already exists' });
      return;
    }
    throw err;
  }
}));

// GET /admin/officers — ADMIN sees all officer roles; agency officer sees own role only
router.get('/officers', authenticate, requireRole('ADMIN', 'IT_DEPT', 'ED', 'CBI', 'COURT', 'BANK'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const callerRole = req.user!.role;

  const result = callerRole === 'ADMIN'
    ? await db.query(
        "SELECT subject_hash, login_id, name, role, is_active, created_at, last_login FROM bsc_users WHERE role = ANY($1) ORDER BY created_at DESC",
        [OFFICER_ROLES]
      )
    : await db.query(
        "SELECT subject_hash, login_id, name, role, is_active, created_at, last_login FROM bsc_users WHERE role = $1 ORDER BY created_at DESC",
        [callerRole]
      );

  res.json({ success: true, data: result.rows });
}));

// PUT /admin/officers/:hash/status — ADMIN toggles any officer; agency officer toggles own role only
router.put('/officers/:hash/status', authenticate, requireRole('ADMIN', 'IT_DEPT', 'ED', 'CBI', 'COURT', 'BANK'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { hash } = req.params;
  const { is_active } = req.body;

  if (typeof is_active !== 'boolean') {
    res.status(400).json({ success: false, error: 'is_active must be a boolean' });
    return;
  }

  const callerRole = req.user!.role;

  if (callerRole !== 'ADMIN') {
    const target = await queryOne<{ role: string }>(
      'SELECT role FROM bsc_users WHERE subject_hash = $1',
      [hash]
    );
    if (!target) {
      res.status(404).json({ success: false, error: 'Officer not found' });
      return;
    }
    if (target.role !== callerRole) {
      res.status(403).json({ success: false, error: 'You can only manage officers in your own agency' });
      return;
    }
  }

  const result = await db.query(
    "UPDATE bsc_users SET is_active = $1 WHERE subject_hash = $2 AND role = ANY($3) RETURNING subject_hash, name, role, is_active",
    [is_active, hash, OFFICER_ROLES]
  );

  if (result.rows.length === 0) {
    res.status(404).json({ success: false, error: 'Officer not found' });
    return;
  }

  res.json({ success: true, data: result.rows[0] });
}));

const ALL_ROLES = ['CITIZEN', 'IT_DEPT', 'ED', 'CBI', 'COURT', 'BANK', 'ADMIN', 'PUBLIC'] as const;

const UpdatePermissionSchema = z.object({
  dataTypes:   z.array(z.string().min(1)).min(1),
  requiresRef: z.boolean(),
});

// GET /admin/permissions — returns the full permission matrix for all roles
router.get('/permissions', authenticate, requireRole('ADMIN'), asyncHandler(async (_req: AuthRequest, res: Response) => {
  const rules = await getAllPermissions();
  res.json({ success: true, data: rules });
}));

// PUT /admin/permissions/:role — updates allowed data types and requiresRef for one role
router.put('/permissions/:role', authenticate, requireRole('ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.params;

  if (!(ALL_ROLES as readonly string[]).includes(role)) {
    res.status(400).json({ success: false, error: `Unknown role: ${role}` });
    return;
  }

  const parsed = UpdatePermissionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }

  const { dataTypes, requiresRef } = parsed.data;
  const rule = await updatePermission(role, dataTypes, requiresRef);
  res.json({ success: true, data: rule });
}));

export default router;
