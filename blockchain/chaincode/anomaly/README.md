# chaincode/anomaly — WEALTH_ANOMALY_DETECTOR

Hyperledger Fabric chaincode (Go) that automatically flags suspicious wealth patterns.

## What This Contract Does

Triggered every time a new ITR, property registration, or financial asset is linked to a citizen node. Compares declared income against accumulated assets using five rules:

| Rule | Condition | Severity |
|---|---|---|
| Income Asset Mismatch | Assets acquired > 2× declared income | YELLOW |
| Serious Unexplained Wealth | Net worth > 4× cumulative 5-year income | RED |
| Public Official Wealth Surge | Official net worth grows >300% in 3 years | RED |
| Benami Suspicion | >3 properties across family, family income <20% of property value | ORANGE |
| Shell Company Link | >5 company directorships, company revenue < lifestyle cost | ORANGE |

## Files

| File | Purpose |
|---|---|
| `anomaly.go` | Main chaincode — Init, Invoke, all rule implementations |
| `anomaly_test.go` | Unit tests — one test per rule, boundary conditions |
| `keys.go` | Ledger key schema — all state key definitions in one place |
| `types.go` | Go structs for citizen nodes, flags, thresholds |
| `go.mod` | Go module definition |

## Running Tests

```bash
go test ./... -v
```

## Threshold Configuration

Thresholds (the `2×`, `4×`, `300%` values) are stored in ledger state — not hardcoded. They are updated via the governance contract. Never hardcode a threshold into rule logic.
