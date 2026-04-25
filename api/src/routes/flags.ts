import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import * as flagService from '../services/flag.service';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// GET /flags — get flags by severity (officer view)
router.get('/', authenticate, requireRole('IT_DEPT', 'ED', 'CBI', 'ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { severity } = req.query;

  if (severity && typeof severity === 'string') {
    const flags = await flagService.getFlagsBySeverity(severity);
    res.json({ success: true, data: flags });
    return;
  }

  const flags = await flagService.getAllFlags();
  res.json({ success: true, data: flags });
}));

const UpdateStatusSchema = z.object({
  status: z.enum(['OPEN', 'UNDER_INVESTIGATION', 'CLEARED', 'ESCALATED']),
  resolutionNotes: z.string().optional().default(''),
});

// PUT /flags/:id — update flag status (officers only)
router.put('/:id', authenticate, requireRole('IT_DEPT', 'ED', 'CBI', 'ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = UpdateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }

  await flagService.updateFlagStatus(req.params.id, parsed.data.status, parsed.data.resolutionNotes);
  res.json({ success: true, data: { message: 'Flag status updated' } });
}));

const ManualFlagSchema = z.object({
  citizenHash: z.string().length(64),
  ruleTriggered: z.enum(['BENAMI_SUSPICION', 'SHELL_COMPANY_LINK', 'FOREIGN_ASSET_UNDECLARED', 'LIFESTYLE_MISMATCH']),
  severity: z.enum(['YELLOW', 'ORANGE', 'RED']),
  description: z.string().min(10),
  assetValue: z.number().int().min(0),
  incomeValue: z.number().int().min(0),
  gapAmount: z.number().int().min(0),
});

// POST /flags/manual — submit a manual flag (benami, shell company, etc.)
router.post('/manual', authenticate, requireRole('IT_DEPT', 'ED', 'CBI'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = ManualFlagSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }

  const flag = await flagService.submitManualFlag(parsed.data);
  res.status(201).json({ success: true, data: flag });
}));

export default router;
