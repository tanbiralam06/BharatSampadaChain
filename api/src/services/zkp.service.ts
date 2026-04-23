import * as fabric from '../fabric/contracts';
import type { ZKPProof } from '../models';

export async function submitProof(params: {
  citizenHash: string; queryType: string;
  proof: string; publicInputs: string; submittedBy: string;
}): Promise<ZKPProof> {
  return fabric.submitZKPProof(params);
}

export async function getVerifiedClaims(citizenHash: string): Promise<unknown[]> {
  return fabric.getVerifiedClaims(citizenHash);
}
