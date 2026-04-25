import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as fabric from '../fabric/contracts';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

const ProofSchema = z.object({
  queryType: z.enum(['INCOME_ABOVE_THRESHOLD', 'ASSET_RANGE', 'RESIDENCE', 'TAX_COMPLIANCE']),
  proof: z.string().min(1),
  publicInputs: z.string().min(1),
});

// POST /zkp/:citizenHash — submit a ZKP proof for a citizen
router.post('/:citizenHash', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = ProofSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }

  const result = await fabric.submitZKPProof({
    citizenHash: req.params.citizenHash,
    queryType: parsed.data.queryType,
    proof: parsed.data.proof,
    publicInputs: parsed.data.publicInputs,
    submittedBy: req.user!.sub,
  });

  res.status(201).json({ success: true, data: result });
}));

// GET /zkp/:citizenHash/claims — get verified claims for a citizen
router.get('/:citizenHash/claims', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const claims = await fabric.getVerifiedClaims(req.params.citizenHash);
  res.json({ success: true, data: claims });
}));

export default router;
