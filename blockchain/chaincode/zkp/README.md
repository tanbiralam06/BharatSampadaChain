# chaincode/zkp — ZKP_VERIFIER

Hyperledger Fabric chaincode (Go) that verifies Zero Knowledge Proofs on-chain and stores permanent proof records.

## What This Contract Does

ZKP proofs are generated off-chain (in `zkp/scripts/`) using snarkjs. This contract:

1. Receives the proof + public inputs
2. Verifies the Groth16 proof using the verification key
3. Returns VALID or INVALID
4. Writes a permanent record to the ledger: proof hash, query type, timestamp, result

The actual citizen data never reaches this contract. The proof is just math.

## Supported Query Types

| Query | Circuit | Public Input |
|---|---|---|
| `NET_WORTH_THRESHOLD` | `rangeCheck.circom` | Threshold amount |
| `INCOME_CONSISTENCY` | `consistency.circom` | Ratio threshold |
| `STATE_OWNERSHIP` | `ownership.circom` | State ID |
| `WEALTH_GROWTH_RATE` | `growth.circom` | Growth % and year count |

## Proof Record (On-Chain)

```json
{
  "proof_id": "ZKP-2026-00234",
  "query_type": "NET_WORTH_THRESHOLD",
  "citizen_node_id": "BSC-CIT-001",
  "result": "VALID",
  "public_inputs": ["100000000"],
  "proof_hash": "sha256:a3f9...",
  "timestamp": "2026-04-20T09:14:33Z",
  "requested_by": "BANK-HDFC-001"
}
```

## Files

| File | Purpose |
|---|---|
| `zkpverifier.go` | Main chaincode — VerifyProof, GetProofRecord |
| `zkpverifier_test.go` | Unit tests — valid proof, invalid proof, replay attack |
| `verificationkeys.go` | Groth16 verification keys for all 4 circuits |
| `keys.go` | Ledger key schema |
| `go.mod` | Go module definition |

## Running Tests

```bash
go test ./... -v
```

## Replay Protection

Each proof includes a nonce. The contract rejects any proof with a nonce that has already been used. This prevents an attacker from replaying a valid YES proof for a different query.
