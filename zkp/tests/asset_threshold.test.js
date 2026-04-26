// Tests for the asset_threshold circuit.
// Runs AFTER setup.sh has generated the keys.
//
// Run: node tests/asset_threshold.test.js
// Or:  npm test (from zkp/)

import snarkjs from 'snarkjs';
import { buildPoseidon } from 'circomlibjs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEYS_DIR  = path.join(__dirname, '../keys');
const WASM      = path.join(KEYS_DIR, 'asset_threshold_js/asset_threshold.wasm');
const ZKEY      = path.join(KEYS_DIR, 'proving_key.zkey');
const VKEY      = JSON.parse(fs.readFileSync(path.join(KEYS_DIR, 'verification_key.json'), 'utf-8'));

let poseidon;
let passed = 0;
let failed = 0;

async function setup() {
  poseidon = await buildPoseidon();
}

function commitment(assets, salt) {
  return poseidon.F.toString(poseidon([assets, salt]));
}

async function prove(assets, threshold) {
  const salt = BigInt('0x' + crypto.randomBytes(30).toString('hex'));
  const c    = commitment(assets, salt);
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    { totalAssets: assets.toString(), salt: salt.toString(), threshold: threshold.toString(), commitment: c },
    WASM, ZKEY
  );
  return { proof, publicSignals };
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}: ${err.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg ?? 'assertion failed');
}

async function run() {
  await setup();

  console.log('\nasset_threshold circuit tests\n');

  await test('proof is valid when assets > threshold', async () => {
    const { proof, publicSignals } = await prove(5_000_000_000n, 1_000_000_000n);
    assert(await snarkjs.groth16.verify(VKEY, publicSignals, proof), 'expected VALID');
  });

  await test('proof is valid when assets === threshold (exact equality)', async () => {
    const { proof, publicSignals } = await prove(1_000_000_000n, 1_000_000_000n);
    assert(await snarkjs.groth16.verify(VKEY, publicSignals, proof), 'expected VALID');
  });

  await test('proof generation fails when assets < threshold', async () => {
    let threw = false;
    try {
      await prove(500_000_000n, 1_000_000_000n);
    } catch {
      threw = true;
    }
    assert(threw, 'expected proof generation to fail (constraint not satisfied)');
  });

  await test('tampered publicSignals fails verification', async () => {
    const { proof, publicSignals } = await prove(5_000_000_000n, 1_000_000_000n);
    const tampered = [...publicSignals];
    tampered[0] = '999999999999999'; // change threshold
    const valid = await snarkjs.groth16.verify(VKEY, tampered, proof);
    assert(!valid, 'expected INVALID for tampered public signals');
  });

  await test('tampered proof fails verification', async () => {
    const { proof, publicSignals } = await prove(5_000_000_000n, 1_000_000_000n);
    const tampered = { ...proof, pi_a: [...proof.pi_a] };
    tampered.pi_a[0] = '1';
    const valid = await snarkjs.groth16.verify(VKEY, publicSignals, tampered);
    assert(!valid, 'expected INVALID for tampered proof');
  });

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => { console.error(err); process.exit(1); });
