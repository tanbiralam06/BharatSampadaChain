#!/usr/bin/env node
// Standalone prover — generates a Groth16 proof for the asset_threshold circuit.
//
// Usage:
//   node scripts/prove.js --assets 5000000000 --threshold 1000000000
//   node scripts/prove.js --assets 5000000000 --threshold 1000000000 --out proof.json
//
// --assets    Total declared assets in PAISA (integer)
// --threshold Threshold to compare against in PAISA (integer)
// --out       Optional output file (defaults to stdout)

import snarkjs from 'snarkjs';
import { buildPoseidon } from 'circomlibjs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEYS_DIR  = path.join(__dirname, '../keys');

function parseArgs() {
  const args = process.argv.slice(2);
  const get  = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
  const assets    = get('--assets');
  const threshold = get('--threshold');
  if (!assets || !threshold) {
    console.error('Usage: node scripts/prove.js --assets <paisa> --threshold <paisa>');
    process.exit(1);
  }
  return { assets: BigInt(assets), threshold: BigInt(threshold), out: get('--out') };
}

async function main() {
  const { assets, threshold, out } = parseArgs();

  const poseidon = await buildPoseidon();
  const salt = BigInt('0x' + crypto.randomBytes(30).toString('hex'));
  const commitment = poseidon.F.toString(poseidon([assets, salt]));

  const input = {
    totalAssets: assets.toString(),
    salt:        salt.toString(),
    threshold:   threshold.toString(),
    commitment,
  };

  const wasmPath = path.join(KEYS_DIR, 'asset_threshold_js/asset_threshold.wasm');
  const zkeyPath = path.join(KEYS_DIR, 'proving_key.zkey');

  console.error('Generating proof...');
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);

  const result = { proof, publicSignals, commitment, salt: salt.toString() };

  if (out) {
    fs.writeFileSync(out, JSON.stringify(result, null, 2));
    console.error(`Proof written to ${out}`);
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

main().catch((err) => { console.error(err.message); process.exit(1); });
