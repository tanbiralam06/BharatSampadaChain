import snarkjs from 'snarkjs';
import { buildPoseidon } from 'circomlibjs';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import * as fabric from '../fabric/contracts';
import { db } from '../db/client';

// Keys generated once by: docker compose run --rm zkp-setup  (from zkp/)
const KEYS_DIR = path.resolve(__dirname, '../../../zkp/keys');

function keysReady(): boolean {
  return (
    fs.existsSync(path.join(KEYS_DIR, 'asset_threshold_js/asset_threshold.wasm')) &&
    fs.existsSync(path.join(KEYS_DIR, 'proving_key.zkey')) &&
    fs.existsSync(path.join(KEYS_DIR, 'verification_key.json'))
  );
}

let _poseidon: Awaited<ReturnType<typeof buildPoseidon>> | null = null;
async function getPoseidon() {
  if (!_poseidon) _poseidon = await buildPoseidon();
  return _poseidon;
}

// ── Core: generate a Groth16 proof ───────────────────────────────────────────

async function generateProof(totalAssets: bigint, threshold: bigint) {
  if (!keysReady()) {
    throw Object.assign(
      new Error('ZKP keys not found. Run: docker compose run --rm zkp-setup (inside zkp/)'),
      { status: 503 }
    );
  }

  const poseidon   = await getPoseidon();
  const salt       = BigInt('0x' + crypto.randomBytes(30).toString('hex'));
  const commitment = poseidon.F.toString(poseidon([totalAssets, salt]));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { proof, publicSignals } = await (snarkjs as any).groth16.fullProve(
    { totalAssets: totalAssets.toString(), salt: salt.toString(), threshold: threshold.toString(), commitment },
    path.join(KEYS_DIR, 'asset_threshold_js/asset_threshold.wasm'),
    path.join(KEYS_DIR, 'proving_key.zkey')
  );

  return { proof, publicSignals: publicSignals as string[], commitment };
}

// ── Core: verify a Groth16 proof ─────────────────────────────────────────────

async function verifyProof(proofJSON: string, publicSignals: string[]): Promise<boolean> {
  if (!keysReady()) return false;
  const vkey = JSON.parse(fs.readFileSync(path.join(KEYS_DIR, 'verification_key.json'), 'utf-8'));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (snarkjs as any).groth16.verify(vkey, publicSignals, JSON.parse(proofJSON));
}

// ── High-level: prove → verify → attest on-chain ─────────────────────────────

export async function proveAssetThreshold(params: {
  citizenHash: string;
  threshold:   bigint;
  submittedBy: string;
}): Promise<{
  proofId:       string;
  verified:      boolean;
  publicSignals: string[];
  commitment:    string;
  expiresAt:     string;
}> {
  const { citizenHash, threshold, submittedBy } = params;

  // Read citizen's totalDeclaredAssets from PostgreSQL mirror
  const row = await db.query(
    'SELECT total_declared_assets FROM citizens WHERE citizen_hash = $1',
    [citizenHash]
  );
  if (!row.rows[0]) {
    throw Object.assign(new Error('Citizen not found'), { status: 404 });
  }
  const totalAssets = BigInt(row.rows[0].total_declared_assets);

  // Generate proof (circuit constraint fails if totalAssets < threshold)
  let generated: Awaited<ReturnType<typeof generateProof>>;
  try {
    generated = await generateProof(totalAssets, threshold);
  } catch (err) {
    const msg = (err as Error).message ?? '';
    if (msg.includes('Assert Failed') || msg.includes('not satisf') || msg.includes('Error in template')) {
      throw Object.assign(
        new Error('Assets do not meet the requested threshold — proof cannot be generated'),
        { status: 422 }
      );
    }
    throw err;
  }

  // Verify (sanity-check — if generation passed, verification must pass)
  const proofJSON = JSON.stringify(generated.proof);
  const verified  = await verifyProof(proofJSON, generated.publicSignals);
  if (!verified) {
    throw Object.assign(new Error('Internal: proof generated but failed verification'), { status: 500 });
  }

  // Record immutable attestation on-chain
  const record = await fabric.submitZKPProof({
    citizenHash,
    queryType:         'ASSET_ABOVE_THRESHOLD',
    proofJSON,
    publicSignalsJSON: JSON.stringify(generated.publicSignals),
    threshold:         threshold.toString(),
    submittedBy,
    isVerified:        true,
  });

  return {
    proofId:       record.proofId,
    verified:      record.isVerified,
    publicSignals: generated.publicSignals,
    commitment:    generated.commitment,
    expiresAt:     record.expiresAt,
  };
}
