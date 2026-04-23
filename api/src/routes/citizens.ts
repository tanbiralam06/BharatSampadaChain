import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import * as citizenService from '../services/citizen.service';

const router = Router();

// GET /citizens/:hash
router.get('/:hash', authenticate, async (req: AuthRequest, res: Response) => {
  const { hash } = req.params;
  const user = req.user!;

  if (user.role === 'CITIZEN' && user.sub !== hash) {
    res.status(403).json({ success: false, error: 'You can only view your own profile' });
    return;
  }

  const citizen = await citizenService.getCitizen(hash, user);
  res.json({ success: true, data: citizen });
});

const CreateCitizenSchema = z.object({
  citizenHash: z.string().length(64),
  panHash: z.string().length(64),
  name: z.string().min(1).max(200),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  aadhaarState: z.string().min(1),
  citizenType: z.enum(['civilian', 'government_official', 'politician']),
  totalDeclaredAssets: z.number().int().min(0),
  totalIncome5Yr: z.number().int().min(0),
  prevYearAssets: z.number().int().min(0),
  assets5YrAgo: z.number().int().min(0),
});

// POST /citizens
router.post('/', authenticate, requireRole('ADMIN', 'IT_DEPT'), async (req: AuthRequest, res: Response) => {
  const parsed = CreateCitizenSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }
  const citizen = await citizenService.createCitizen(parsed.data);
  res.status(201).json({ success: true, data: citizen });
});

// POST /citizens/:hash/check-anomaly
router.post('/:hash/check-anomaly', authenticate, requireRole('IT_DEPT', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const result = await citizenService.runAnomalyCheck(req.params.hash);
  res.json({ success: true, data: result });
});

// GET /citizens/:hash/flags
router.get('/:hash/flags', authenticate, async (req: AuthRequest, res: Response) => {
  const { hash } = req.params;
  if (req.user!.role === 'CITIZEN' && req.user!.sub !== hash) {
    res.status(403).json({ success: false, error: 'Forbidden' });
    return;
  }
  const flags = await citizenService.getCitizenFlags(hash);
  res.json({ success: true, data: flags });
});

// GET /citizens/:hash/access-log
router.get('/:hash/access-log', authenticate, async (req: AuthRequest, res: Response) => {
  const { hash } = req.params;
  if (req.user!.role === 'CITIZEN' && req.user!.sub !== hash) {
    res.status(403).json({ success: false, error: 'Forbidden' });
    return;
  }
  const logs = await citizenService.getCitizenAccessLog(hash);
  res.json({ success: true, data: logs });
});

// GET /citizens/:hash/properties
router.get('/:hash/properties', authenticate, async (req: AuthRequest, res: Response) => {
  const { hash } = req.params;
  if (req.user!.role === 'CITIZEN' && req.user!.sub !== hash) {
    res.status(403).json({ success: false, error: 'Forbidden' });
    return;
  }
  const properties = await citizenService.getCitizenProperties(hash, req.user!);
  res.json({ success: true, data: properties });
});

export default router;
