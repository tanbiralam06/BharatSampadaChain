# chaincode/property — PROPERTY_TRANSFER_VALIDATOR

Hyperledger Fabric chaincode (Go) that validates every property registration and transfer before it is written to the ledger.

## Validation Rules

Every property registration must pass all checks before the ledger write is committed:

| Check | Rule | Rejection Reason |
|---|---|---|
| Ownership verification | Seller must be current registered owner on BSC | Prevents double-selling fraud |
| Circle rate floor | Declared value must be ≥80% of government circle rate | Prevents undervaluation to evade stamp duty |
| Court stay check | No existing court stay order on property ID | Prevents transfer of encumbered assets |
| Identity status | Seller's BSC identity node must be active | Prevents transfers by deceased or deregistered persons |
| Rapid flip detection | Flags resale within 90 days of purchase | Identifies speculative or benami transactions |

## Files

| File | Purpose |
|---|---|
| `property.go` | Main chaincode — RegisterProperty, TransferProperty, GetHistory |
| `property_test.go` | Unit tests — all validation rules and edge cases |
| `circlerates.go` | State-wise circle rate lookup (updated via admin) |
| `keys.go` | Ledger key schema |
| `types.go` | Go structs for property records, transfer history |
| `go.mod` | Go module definition |

## Running Tests

```bash
go test ./... -v
```

## Circle Rate Data

Circle rates vary by state and locality. The `circlerates.go` file loads from ledger state — rates can be updated by authorised administrators without redeploying the chaincode.
