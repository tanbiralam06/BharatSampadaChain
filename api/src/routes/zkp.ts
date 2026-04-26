import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as fabric from '../fabric/contracts';
import { proveAssetThreshold } from '../services/zkp.service';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

const ProveSchema = z.object({
  // Threshold in paisa (integer string or number).
  // Example: 5000000000 = ₹50 lakh
  threshold: z.union([z.string(), z.number()])
    .transform((v) => BigInt(v))
    .refine((v) => v > 0n, { message: 'threshold must be a positive integer (paisa)' }),
});

// POST /zkp/:citizenHash/prove
// Reads the citizen's real assets from the ledger, generates a Groth16 proof
// that assets >= threshold, verifies it, and records the attestation on-chain.
// The raw asset value is NEVER returned — only the cryptographic proof.
router.post('/:citizenHash/prove', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = ProveSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }

  const result = await proveAssetThreshold({
    citizenHash: req.params.citizenHash,
    threshold:   parsed.data.threshold,
    submittedBy: req.user!.sub,
  });

  res.status(201).json({ success: true, data: result });
}));

// GET /zkp/:citizenHash/claims
// Returns all active (non-expired) verified claims for a citizen.
router.get('/:citizenHash/claims', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const claims = await fabric.getVerifiedClaims(req.params.citizenHash);
  res.json({ success: true, data: claims });
}));

export default router;
