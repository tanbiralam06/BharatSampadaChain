---
id: zkp
title: Zero Knowledge Proofs
sidebar_label: Zero Knowledge Proofs
---

# Zero Knowledge Proofs

BSC uses Groth16 zero-knowledge proofs to let agencies verify facts about a citizen's wealth without seeing the underlying data.

---

## The Core Problem ZKP Solves

A government loan program needs to verify that an applicant's assets are below ₹50 lakh. The options without ZKP:

1. Show the applicant's exact asset figures to the bank — privacy violation
2. Make the bank trust the applicant's self-declaration — fraud risk
3. Use BSC ZKP: prove that assets < ₹50L without revealing the actual figure

Option 3 is what BSC provides.

---

## How It Works

```
POST /zkp/:citizenHash/prove
  body: { threshold: 5000000 }   ← ₹50 lakh in paisa

1. API fetches citizen's totalDeclaredAssets from PostgreSQL
2. API generates Groth16 proof using circom circuit + snarkjs
3. API verifies proof against stored verification key
4. API submits proof + public signals to zkp chaincode
5. Chaincode records proof hash (anti-replay) + issues VerifiedClaim
6. VerifiedClaim valid for 90 days
```

---

## The Circuit: `asset_threshold`

**Source:** `zkp/circuits/asset_threshold.circom`

```
Private inputs:  actualAssets (paisa)
Public inputs:   threshold (paisa)
Output:          1 if actualAssets >= threshold, else 0
```

The circuit proves the relationship between private and public inputs using Groth16. The proof is mathematically verifiable — any third party can verify the proof is valid using only the public inputs and the verification key, without ever learning `actualAssets`.

---

## What Is Stored On-Chain vs Never Stored

| Data | On-Chain | Never Stored |
|---|---|---|
| Proof hash (SHA-256 of proof JSON) | Yes | — |
| Public signals (Groth16 outputs) | Yes | — |
| Threshold value | Yes | — |
| `isVerified: true` | Yes | — |
| `VerifiedClaim` (type + validity) | Yes | — |
| Actual asset value | Never | Stays in API, discarded after proof |
| Private circuit inputs | Never | — |
| Raw proof JSON (large) | Never | Only hash stored |

---

## Anti-Replay Protection

The chaincode rejects any proof whose SHA-256 hash has been seen before. This prevents an attacker from submitting a stolen proof to create fake claims for a different citizen or a later date.

---

## Getting Verified Claims

```bash
# Check what ZKP claims exist for a citizen
GET /zkp/:citizenHash/claims
```

Returns an array of `VerifiedClaim` objects:
```json
[{
  "claimId": "CLAIM_...",
  "citizenHash": "a1b2c3...",
  "claimType": "ASSET_THRESHOLD_MET",
  "isValid": true,
  "validUntil": "2024-07-15T10:30:00Z",
  "proofId": "ZKP_...",
  "issuedAt": "2024-04-15T10:30:00Z"
}]
```

---

## Setup Requirement

Before the ZKP endpoint is usable, the circuit keys must be generated:

```bash
docker compose run --rm zkp-setup
```

If keys are missing, `POST /zkp/:citizenHash/prove` returns `503 Service Unavailable`.

---

## Planned Future Circuits

| Circuit | Proves |
|---|---|
| `income_threshold` | Annual income ≥ X without revealing exact income |
| `ownership_range` | Number of properties in range [a, b] |
| `growth_check` | Asset growth is consistent with declared income |
