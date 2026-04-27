---
id: zkp
title: ZKP Chaincode
sidebar_label: ZKP Verifier
---

# ZKP Chaincode

**Source:** `blockchain/chaincode/zkp/` · **Version:** v1.1 · **Language:** Go

The ZKP chaincode records verified Groth16 zero-knowledge proofs and issues time-limited verified claims.

---

## State Keys

| Key Pattern | Type | Description |
|---|---|---|
| `ZKP_<proofId>` | ZKPProof | Verified proof record |
| `CLAIM_<citizenHash>_<claimId>` | VerifiedClaim | Time-limited claim |

---

## Data Structures

### ZKPProof

```go
type ZKPProof struct {
    ProofID       string
    CitizenHash   string
    QueryType     string    // "asset_threshold"
    ProofHash     string    // SHA-256 of the proof JSON (anti-replay)
    PublicSignals []string  // Groth16 public outputs
    Threshold     int64     // paisa — what was proven
    IsVerified    bool      // true = API verified before submission
    CreatedAt     string
    ExpiresAt     string
    SubmittedBy   string
}
```

### VerifiedClaim

```go
type VerifiedClaim struct {
    ClaimID     string
    CitizenHash string
    ClaimType   string  // "ASSET_THRESHOLD_MET"
    IsValid     bool
    ValidUntil  string  // RFC3339
    ProofID     string
    IssuedAt    string
}
```

---

## How It Works

The ZKP workflow is split between the API layer and the chaincode:

1. **API receives proof request** (`POST /zkp/:citizenHash/prove` with threshold)
2. **API fetches citizen assets** from PostgreSQL mirror
3. **API generates Groth16 proof** using snarkjs + the `asset_threshold.circom` circuit
4. **API verifies the proof** against the stored verification key
5. **API submits to chaincode** — only verified proofs are accepted
6. **Chaincode records proof hash** — prevents replay attacks (same proof rejected twice)
7. **Chaincode issues a VerifiedClaim** — valid for 90 days

---

## The `asset_threshold` Circuit

**Source:** `zkp/circuits/asset_threshold.circom`

This circuit proves that a citizen's total declared assets exceed a threshold, without revealing the actual asset value.

**Private inputs:** actual asset value (in paisa)
**Public inputs:** threshold value (in paisa)
**Output:** 1 if `assets >= threshold`, 0 otherwise

**What is stored on-chain:** the proof hash, public signals, threshold, and timestamp
**What is never stored:** the actual asset value, or anything that could reveal it

---

## Exported Functions

### `SubmitProof`

Records a verified Groth16 proof. Anti-replay: rejects if the proof hash has been seen before.

**Parameters:** citizenHash, queryType, proofJSON, publicSignalsJSON, threshold, submittedBy, isVerifiedStr

### `GetProof`

Returns a proof record by ID.

### `GetVerifiedClaims`

Returns all non-expired verified claims for a citizen.

### `GetProofsByQueryType`

Returns all proofs for a citizen of a given query type.

---

## ZKP Setup Requirement

The circuit proving key and verification key must be generated before the ZKP endpoint works:

```bash
docker compose run --rm zkp-setup
```

This runs `snarkjs groth16 setup` with the `asset_threshold.circom` circuit and a trusted ceremony. The generated keys are stored in `zkp/keys/` (gitignored).

If the keys are missing, `POST /zkp/:citizenHash/prove` returns `503 Service Unavailable`.

---

## Planned Future Circuits

| Circuit | What it Proves |
|---|---|
| `income_threshold` | Income ≥ X without revealing exact figure |
| `ownership_range` | Number of properties in range [a, b] |
| `consistency_check` | Income and assets are mutually consistent |
