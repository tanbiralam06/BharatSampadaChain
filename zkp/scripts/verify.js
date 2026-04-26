#!/usr/bin/env node
// Standalone verifier — verifies a Groth16 proof against the verification key.
//
// Usage:
//   node scripts/verify.js --proof proof.json
//   cat proof.json | node scripts/verify.js
//
// Exits 0 if VALID, 1 if INVALID.

import snarkjs from 'snarkjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEYS_DIR  = path.join(__dirname, '../keys');

async function main() {
  const args    = process.argv.slice(2);
  const fileArg = args[args.indexOf('--proof') + 1];

  let raw;
  if (fileArg) {
    raw = fs.readFileSync(fileArg, 'utf-8');
  } else {
    raw = fs.readFileSync('/dev/stdin', 'utf-8');
  }

  const { proof, publicSignals } = JSON.parse(raw);

  const vkeyPath = path.join(KEYS_DIR, 'verification_key.json');
  const vkey     = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));

  const valid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
  console.log(valid ? 'VALID' : 'INVALID');
  process.exit(valid ? 0 : 1);
}

main().catch((err) => { console.error(err.message); process.exit(1); });
