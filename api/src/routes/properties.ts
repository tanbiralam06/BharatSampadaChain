import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import * as propertyService from '../services/property.service';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

const RegisterSchema = z.object({
  propertyId: z.string().min(1),
  ownerHash: z.string().length(64),
  registrationNo: z.string().min(1),
  propertyType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'AGRICULTURAL', 'INDUSTRIAL', 'PLOT']),
  declaredValue: z.number().int().positive(),
  circleRateValue: z.number().int().min(0),
  areaSqft: z.number().int().positive(),
  district: z.string().min(1),
  state: z.string().min(1),
  registrationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  transferType: z.enum(['PURCHASE', 'INHERITANCE', 'GIFT', 'COURT_ORDER']),
  stampDutyPaid: z.number().int().min(0),
});

// POST /properties
router.post('/', authenticate, requireRole('ADMIN', 'IT_DEPT'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }
  const property = await propertyService.registerProperty(parsed.data);
  res.status(201).json({ success: true, data: property });
}));

// GET /properties/:id
router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const property = await propertyService.getProperty(req.params.id);
  res.json({ success: true, data: property });
}));

const TransferSchema = z.object({
  newOwnerHash: z.string().length(64),
  transferType: z.enum(['PURCHASE', 'INHERITANCE', 'GIFT', 'COURT_ORDER']),
  reason: z.string().min(1),
  transferValue: z.number().int().positive(),
});

// PUT /properties/:id/transfer
router.put('/:id/transfer', authenticate, requireRole('ADMIN', 'IT_DEPT'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = TransferSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }
  const transfer = await propertyService.transferProperty({ propertyId: req.params.id, ...parsed.data });
  res.json({ success: true, data: transfer });
}));

const CourtOrderSchema = z.object({
  orderRef: z.string().min(1).max(100),
  reason:   z.string().min(5).max(500),
});

// POST /properties/:id/freeze — COURT only; issues a stay order blocking transfers
router.post('/:id/freeze', authenticate, requireRole('COURT'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = CourtOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }
  const property = await propertyService.freezeProperty({
    propertyId: req.params.id,
    issuedBy:   req.user!.sub,
    ...parsed.data,
  });
  res.json({ success: true, data: property });
}));

// POST /properties/:id/unfreeze — COURT only; lifts an active stay order
router.post('/:id/unfreeze', authenticate, requireRole('COURT'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = CourtOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }
  const property = await propertyService.unfreezeProperty({
    propertyId: req.params.id,
    issuedBy:   req.user!.sub,
    ...parsed.data,
  });
  res.json({ success: true, data: property });
}));

// GET /properties/:id/court-orders — COURT, ADMIN, IT_DEPT, ED, CBI
router.get('/:id/court-orders', authenticate, requireRole('COURT', 'ADMIN', 'IT_DEPT', 'ED', 'CBI'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const orders = await propertyService.getCourtOrders(req.params.id);
  res.json({ success: true, data: orders });
}));

export default router;
