import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { queryOne } from '../db/client';
import { signToken } from '../middleware/auth';

const router = Router();

const LoginSchema = z.object({
  identifier: z.string().min(1), // citizenHash, officerID, or admin ID
  password: z.string().min(8),
  role: z.enum(['CITIZEN', 'IT_DEPT', 'ED', 'CBI', 'COURT', 'BANK', 'ADMIN', 'PUBLIC']),
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }

  const { identifier, password, role } = parsed.data;

  const user = await queryOne<{
    subject_hash: string; name: string; password_hash: string; role: string;
  }>(
    'SELECT subject_hash, name, password_hash, role FROM bsc_users WHERE subject_hash = $1 AND role = $2',
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

  const token = signToken({ sub: user.subject_hash, role: user.role as never, name: user.name });
  res.json({ success: true, data: { token, name: user.name, role: user.role } });
});

// POST /auth/refresh — returns a new token if current one is still valid
router.post('/refresh', async (req: Request, res: Response) => {
  // authenticate middleware validates the old token; this just issues a fresh one
  const user = (req as { user?: { sub: string; role: never; name: string } }).user;
  if (!user) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }
  const token = signToken({ sub: user.sub, role: user.role, name: user.name });
  res.json({ success: true, data: { token } });
});

export default router;
