import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { queryOne, db } from '../db/client';
import { signToken, authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { config } from '../config';

const router = Router();

const LoginSchema = z.object({
  identifier: z.string().min(1),
  password:   z.string().min(8),
  role:       z.enum(['CITIZEN', 'IT_DEPT', 'ED', 'CBI', 'COURT', 'BANK', 'ADMIN', 'PUBLIC']),
});

// POST /auth/login
// For ADMIN with totp_enabled=true: returns { step: 'totp_required', challenge_token }
// For everyone else: returns { token, name, role }
router.post('/login', async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }

  const { identifier, password, role } = parsed.data;

  const user = await queryOne<{
    subject_hash: string; name: string; password_hash: string; role: string;
    totp_enabled: boolean;
  }>(
    'SELECT subject_hash, name, password_hash, role, totp_enabled FROM bsc_users WHERE login_id = $1 AND role = $2 AND is_active = true',
    [identifier, role]
  );

  if (!user) {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
    return;
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
    return;
  }

  // ADMIN with TOTP enabled: issue a short-lived challenge token instead of a full JWT
  if (user.role === 'ADMIN' && user.totp_enabled) {
    const challengeToken = jwt.sign(
      { sub: user.subject_hash, name: user.name, purpose: 'totp_challenge' },
      config.jwt.secret,
      { expiresIn: '5m' }
    );
    res.json({ success: true, data: { step: 'totp_required', challenge_token: challengeToken } });
    return;
  }

  const token = signToken({ sub: user.subject_hash, role: user.role as never, name: user.name });
  res.json({ success: true, data: { token, name: user.name, role: user.role } });
});

// POST /auth/guest — issues a short-lived PUBLIC-role token (no credentials required)
router.post('/guest', (_req: Request, res: Response) => {
  const token = signToken({ sub: 'public-guest', role: 'PUBLIC', name: 'Public Visitor' });
  res.json({ success: true, data: { token, role: 'PUBLIC', name: 'Public Visitor' } });
});

// POST /auth/refresh — returns a new token if current one is still valid
router.post('/refresh', async (req: Request, res: Response) => {
  const user = (req as { user?: { sub: string; role: never; name: string } }).user;
  if (!user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }
  const token = signToken({ sub: user.sub, role: user.role, name: user.name });
  res.json({ success: true, data: { token } });
});

// ── TOTP endpoints ────────────────────────────────────────────────────────────

// POST /auth/totp/setup — generates a new TOTP secret, stores it (not yet enabled),
// returns the otpauth URI and a QR code data URL for the admin to scan
router.post('/totp/setup', authenticate, requireRole('ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const adminHash = req.user!.sub;
  const adminName = req.user!.name;

  const secret = authenticator.generateSecret();
  const uri    = authenticator.keyuri(adminName, 'BSC Admin Panel', secret);
  const qrCode = await QRCode.toDataURL(uri);

  await db.query(
    'UPDATE bsc_users SET totp_secret = $1, totp_enabled = false WHERE subject_hash = $2',
    [secret, adminHash]
  );

  res.json({ success: true, data: { uri, qrCode } });
}));

// POST /auth/totp/verify-setup — verifies the first code after scanning, enables TOTP
router.post('/totp/verify-setup', authenticate, requireRole('ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    res.status(400).json({ success: false, error: 'code is required' });
    return;
  }

  const adminHash = req.user!.sub;
  const row = await queryOne<{ totp_secret: string | null }>(
    'SELECT totp_secret FROM bsc_users WHERE subject_hash = $1',
    [adminHash]
  );

  if (!row?.totp_secret) {
    res.status(400).json({ success: false, error: 'TOTP setup not initiated. Call /auth/totp/setup first.' });
    return;
  }

  const valid = authenticator.verify({ token: code, secret: row.totp_secret });
  if (!valid) {
    res.status(401).json({ success: false, error: 'Invalid code. Check your authenticator app.' });
    return;
  }

  await db.query(
    'UPDATE bsc_users SET totp_enabled = true WHERE subject_hash = $1',
    [adminHash]
  );

  res.json({ success: true, data: { enabled: true } });
}));

// POST /auth/totp/verify — second login step: takes challenge_token + 6-digit code,
// issues a full ADMIN JWT on success
router.post('/totp/verify', asyncHandler(async (req: Request, res: Response) => {
  const { challenge_token, code } = req.body;
  if (!challenge_token || !code) {
    res.status(400).json({ success: false, error: 'challenge_token and code are required' });
    return;
  }

  let payload: { sub: string; name: string; purpose: string };
  try {
    payload = jwt.verify(challenge_token, config.jwt.secret) as typeof payload;
  } catch {
    res.status(401).json({ success: false, error: 'Challenge token is invalid or expired' });
    return;
  }

  if (payload.purpose !== 'totp_challenge') {
    res.status(401).json({ success: false, error: 'Invalid token type' });
    return;
  }

  const user = await queryOne<{ totp_secret: string | null; totp_enabled: boolean; name: string }>(
    "SELECT totp_secret, totp_enabled, name FROM bsc_users WHERE subject_hash = $1 AND role = 'ADMIN' AND is_active = true",
    [payload.sub]
  );

  if (!user || !user.totp_enabled || !user.totp_secret) {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
    return;
  }

  const valid = authenticator.verify({ token: code, secret: user.totp_secret });
  if (!valid) {
    res.status(401).json({ success: false, error: 'Invalid authenticator code' });
    return;
  }

  const token = signToken({ sub: payload.sub, role: 'ADMIN', name: user.name });
  res.json({ success: true, data: { token, name: user.name, role: 'ADMIN' } });
}));

// POST /auth/totp/disable — verifies a live code then disables TOTP for this admin
router.post('/totp/disable', authenticate, requireRole('ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    res.status(400).json({ success: false, error: 'code is required' });
    return;
  }

  const adminHash = req.user!.sub;
  const row = await queryOne<{ totp_secret: string | null; totp_enabled: boolean }>(
    'SELECT totp_secret, totp_enabled FROM bsc_users WHERE subject_hash = $1',
    [adminHash]
  );

  if (!row?.totp_enabled || !row.totp_secret) {
    res.status(400).json({ success: false, error: 'TOTP is not currently enabled' });
    return;
  }

  const valid = authenticator.verify({ token: code, secret: row.totp_secret });
  if (!valid) {
    res.status(401).json({ success: false, error: 'Invalid authenticator code' });
    return;
  }

  await db.query(
    'UPDATE bsc_users SET totp_enabled = false, totp_secret = NULL WHERE subject_hash = $1',
    [adminHash]
  );

  res.json({ success: true, data: { disabled: true } });
}));

// GET /auth/totp/status — returns whether TOTP is enabled for the current admin
router.get('/totp/status', authenticate, requireRole('ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const row = await queryOne<{ totp_enabled: boolean }>(
    'SELECT totp_enabled FROM bsc_users WHERE subject_hash = $1',
    [req.user!.sub]
  );
  res.json({ success: true, data: { enabled: row?.totp_enabled ?? false } });
}));

export default router;
