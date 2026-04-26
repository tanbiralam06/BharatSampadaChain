import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import * as citizenService from '../services/citizen.service';
import * as benamiService from '../services/benami.service';
import * as flagService from '../services/flag.service';
import { asyncHandler } from '../utils/asyncHandler';
import { query } from '../db/client';

const router = Router();

// GET /citizens — list citizens from PostgreSQL mirror (public-safe: no PAN hash or DOB)
// Roles: all authenticated roles including PUBLIC
// Query params: type (civilian|government_official|politician), state, search (name ILIKE), limit
router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type, state, search, limit = '50' } = req.query;

  const conditions: string[] = ['is_active = true'];
  const params: unknown[] = [];

  if (type && typeof type === 'string') {
    params.push(type);
    conditions.push(`citizen_type = $${params.length}`);
  }
  if (state && typeof state === 'string') {
    params.push(state);
    conditions.push(`aadhaar_state = $${params.length}`);
  }
  if (search && typeof search === 'string') {
    params.push(`%${search}%`);
    conditions.push(`name ILIKE $${params.length}`);
  }

  params.push(Math.min(parseInt(limit as string, 10) || 50, 200));
  const limitClause = `LIMIT $${params.length}`;

  const rows = await query<{
    citizen_hash: string; name: string; citizen_type: string;
    aadhaar_state: string; total_declared_assets: number;
    total_income_5yr: number; anomaly_score: number; created_at: string;
  }>(
    `SELECT citizen_hash, name, citizen_type, aadhaar_state,
            total_declared_assets, total_income_5yr, anomaly_score, created_at
     FROM citizens
     WHERE ${conditions.join(' AND ')}
     ORDER BY anomaly_score DESC, name ASC
     ${limitClause}`,
    params
  );

  res.json({ success: true, data: rows });
}));

// GET /citizens/:hash/financial-assets — off-chain assets from PostgreSQL
// Roles: CITIZEN (own only), officers and above
router.get('/:hash/financial-assets', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { hash } = req.params;
  const { role, sub } = req.user!;

  if (role === 'CITIZEN' && sub !== hash) {
    res.status(403).json({ success: false, error: 'You can only view your own financial assets' });
    return;
  }

  const rows = await query<{
    asset_id: string; owner_hash: string; asset_type: string;
    institution_name: string | null; balance_range: string | null;
    approximate_value: number; as_of_date: string | null;
    source_agency: string | null; verification_status: string;
    is_joint_account: boolean; joint_owner_hash: string | null;
    created_at: string;
  }>(
    `SELECT asset_id, owner_hash, asset_type, institution_name, balance_range,
            approximate_value, as_of_date, source_agency, verification_status,
            is_joint_account, joint_owner_hash, created_at
     FROM financial_assets
     WHERE owner_hash = $1
     ORDER BY approximate_value DESC`,
    [hash]
  );

  res.json({ success: true, data: rows });
}));

// GET /citizens/:hash
router.get('/:hash', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { hash } = req.params;
  const user = req.user!;

  if (user.role === 'CITIZEN' && user.sub !== hash) {
    res.status(403).json({ success: false, error: 'You can only view your own profile' });
    return;
  }

  const citizen = await citizenService.getCitizen(hash, user);
  res.json({ success: true, data: citizen });
}));

const CreateCitizenSchema = z.object({
  citizenHash: z.string().min(8).max(128),
  panHash: z.string().min(8).max(128),
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
router.post('/', authenticate, requireRole('ADMIN', 'IT_DEPT'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = CreateCitizenSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }
  const citizen = await citizenService.createCitizen(parsed.data);
  res.status(201).json({ success: true, data: citizen });
}));

// POST /citizens/:hash/check-anomaly
router.post('/:hash/check-anomaly', authenticate, requireRole('IT_DEPT', 'ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await citizenService.runAnomalyCheck(req.params.hash);
  res.json({ success: true, data: result });
}));

// POST /citizens/:hash/check-benami
// Runs 4 benami/cross-citizen detection rules using PostgreSQL mirror data.
// Triggered rules write immutable AnomalyFlags via the anomaly chaincode.
router.post('/:hash/check-benami', authenticate, requireRole('IT_DEPT', 'ED', 'CBI', 'ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await benamiService.runBenamiScan(req.params.hash, req.user!.sub);
  res.json({ success: true, data: result });
}));

// GET /citizens/:hash/flags
router.get('/:hash/flags', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { hash } = req.params;
  if (req.user!.role === 'CITIZEN' && req.user!.sub !== hash) {
    res.status(403).json({ success: false, error: 'Forbidden' });
    return;
  }
  const flags = await citizenService.getCitizenFlags(hash);
  res.json({ success: true, data: flags });
}));

// GET /citizens/:hash/access-log
router.get('/:hash/access-log', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { hash } = req.params;
  if (req.user!.role === 'CITIZEN' && req.user!.sub !== hash) {
    res.status(403).json({ success: false, error: 'Forbidden' });
    return;
  }
  const logs = await citizenService.getCitizenAccessLog(hash);
  res.json({ success: true, data: logs });
}));

// GET /citizens/:hash/properties
router.get('/:hash/properties', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { hash } = req.params;
  if (req.user!.role === 'CITIZEN' && req.user!.sub !== hash) {
    res.status(403).json({ success: false, error: 'Forbidden' });
    return;
  }
  const properties = await citizenService.getCitizenProperties(hash, req.user!);
  res.json({ success: true, data: properties });
}));

const BankFlagSchema = z.object({
  discrepancyAmount: z.number().int().positive(),
  description:       z.string().min(10).max(500),
  accountRef:        z.string().min(1).max(100),
});

// POST /citizens/:hash/bank-flag — BANK only; reports a financial discrepancy
router.post('/:hash/bank-flag', authenticate, requireRole('BANK'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = BankFlagSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }
  const { discrepancyAmount, description, accountRef } = parsed.data;
  const flag = await flagService.submitManualFlag({
    citizenHash:   req.params.hash,
    ruleTriggered: 'BANK_DISCREPANCY',
    severity:      'ORANGE',
    description:   `[${accountRef}] ${description}`,
    assetValue:    discrepancyAmount,
    incomeValue:   0,
    gapAmount:     discrepancyAmount,
  });
  res.status(201).json({ success: true, data: flag });
}));

export default router;
