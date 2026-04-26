#!/bin/sh
set -e

echo "============================================================"
echo " BSC ZKP — Trusted Setup"
echo "============================================================"
echo ""

CIRCUITS_DIR=/circuits
KEYS_DIR=/keys
BUILD_DIR=/build

# ── Step 1: Compile the circuit ───────────────────────────────────────────────
echo "Step 1/4: Compiling asset_threshold circuit..."
circom "$CIRCUITS_DIR/asset_threshold.circom" \
  --r1cs --wasm --sym \
  --output "$KEYS_DIR" \
  -l "$BUILD_DIR/node_modules"

echo "  Constraint count:"
snarkjs r1cs info "$KEYS_DIR/asset_threshold.r1cs"
echo ""

# ── Step 2: Powers of Tau (fully local — no download, no external ceremony) ──
echo "Step 2/4: Generating Powers of Tau (local ceremony, 2^12 constraints)..."
snarkjs powersoftau new bn128 12 "$KEYS_DIR/pot12_0000.ptau" -v
snarkjs powersoftau contribute "$KEYS_DIR/pot12_0000.ptau" "$KEYS_DIR/pot12_0001.ptau" \
  --name="BSC-Phase1" -e="bsc_zkp_phase1_$(date +%s)" -v
snarkjs powersoftau prepare phase2 "$KEYS_DIR/pot12_0001.ptau" "$KEYS_DIR/pot12_final.ptau" -v
echo ""

# ── Step 3: Circuit-specific setup (Phase 2) ──────────────────────────────────
echo "Step 3/4: Generating proving key..."
snarkjs groth16 setup \
  "$KEYS_DIR/asset_threshold.r1cs" \
  "$KEYS_DIR/pot12_final.ptau" \
  "$KEYS_DIR/proving_key_0.zkey"

snarkjs zkey contribute \
  "$KEYS_DIR/proving_key_0.zkey" \
  "$KEYS_DIR/proving_key.zkey" \
  --name="BSC-Phase2" -e="bsc_zkp_phase2_$(date +%s)"
echo ""

# ── Step 4: Export verification key ──────────────────────────────────────────
echo "Step 4/4: Exporting verification key..."
snarkjs zkey export verificationkey \
  "$KEYS_DIR/proving_key.zkey" \
  "$KEYS_DIR/verification_key.json"

# Clean up intermediate files (keep only what runtime needs)
rm -f "$KEYS_DIR/pot12_0000.ptau" \
      "$KEYS_DIR/pot12_0001.ptau" \
      "$KEYS_DIR/pot12_final.ptau" \
      "$KEYS_DIR/proving_key_0.zkey" \
      "$KEYS_DIR/asset_threshold.r1cs" \
      "$KEYS_DIR/asset_threshold.sym"

echo ""
echo "============================================================"
echo " Setup complete. Runtime files in zkp/keys/:"
echo "============================================================"
ls -lh "$KEYS_DIR/"
echo ""
echo "Next: cd api && npm run dev"
echo "The API reads keys from ../zkp/keys/ at startup."
