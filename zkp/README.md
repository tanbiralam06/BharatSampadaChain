# zkp/

Zero Knowledge Proof module. Standalone math library — no blockchain dependency, no API dependency.

## Structure

```
zkp/
├── circuits/         — circom circuit source files
│   ├── rangeCheck.circom      — "Does net worth exceed ₹X?"
│   ├── consistency.circom     — "Is declared income consistent with assets?"
│   ├── ownership.circom       — "Does citizen own property in State X?"
│   └── growth.circom          — "Did wealth grow >X% in Y years?"
├── scripts/
│   ├── compile.js    — Compiles all circuits with circom
│   ├── setup.js      — Runs Groth16 trusted setup (Powers of Tau reuse)
│   ├── prove.js      — Generates a proof given a circuit + private inputs
│   └── verify.js     — Verifies a proof against the verification key
├── tests/
│   ├── rangeCheck.test.js
│   ├── consistency.test.js
│   ├── ownership.test.js
│   └── growth.test.js
└── keys/             — Proving keys and verification keys (NEVER commit — in .gitignore)
```

## Prerequisites

```bash
# Install circom
npm install -g circom

# Install snarkjs
npm install -g snarkjs

# Install local dependencies
npm install
```

## Running All Circuits (First Time)

```bash
node scripts/compile.js    # Compile .circom files to .r1cs and .wasm
node scripts/setup.js      # Download Powers of Tau + generate proving keys
```

**The setup step is slow (several minutes) but runs only once.** Keys are stored in `keys/` and are NOT committed to git (too large, and contain sensitive randomness artifacts).

## Generating a Proof

```bash
node scripts/prove.js \
  --circuit rangeCheck \
  --input '{"net_worth": "38000000", "threshold": "10000000"}' \
  --output proof.json
```

## Verifying a Proof

```bash
node scripts/verify.js \
  --circuit rangeCheck \
  --proof proof.json \
  --public '["10000000"]'
# Output: VALID or INVALID
```

## Running Tests

```bash
node tests/run-all.js
```

## Trusted Setup

BSC reuses the public **Perpetual Powers of Tau** ceremony. We do not run a new ceremony. The ceremony transcript hash used is documented in `scripts/setup.js`. Do not modify it.

## Important: No Raw Data in Proofs

Private inputs (net worth, income, property list) are consumed locally when generating the proof. They are never transmitted to the API or stored anywhere. The proof JSON contains only the mathematical proof — not the input values.
