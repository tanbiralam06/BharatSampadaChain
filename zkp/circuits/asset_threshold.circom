pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";

// Proves: totalAssets >= threshold
// WITHOUT revealing totalAssets to the verifier.
//
// Private inputs (never leave the prover):
//   totalAssets — actual value in paisa, read from the BSC ledger
//   salt        — random nonce, prevents brute-force guessing of totalAssets
//
// Public inputs (visible to anyone who verifies the proof):
//   threshold   — the amount being compared against (paisa)
//   commitment  — Poseidon(totalAssets, salt), binds the proof to real ledger data
//
// A bank or court verifies the proof using only the verification key
// and public inputs. They learn nothing about the actual asset value.

template AssetThreshold() {
    // ── Private signals ───────────────────────────────────────────
    signal input totalAssets;
    signal input salt;

    // ── Public signals ────────────────────────────────────────────
    signal input threshold;
    signal input commitment;

    // ── 1. Verify commitment ──────────────────────────────────────
    // Ensures the prover used the real totalAssets from the ledger.
    component hasher = Poseidon(2);
    hasher.inputs[0] <== totalAssets;
    hasher.inputs[1] <== salt;
    hasher.out === commitment;

    // ── 2. Prove totalAssets >= threshold ─────────────────────────
    // 64-bit range covers paisa values up to ~184 crore crore.
    component gte = GreaterEqThan(64);
    gte.in[0] <== totalAssets;
    gte.in[1] <== threshold;
    gte.out === 1;
}

component main {public [threshold, commitment]} = AssetThreshold();
