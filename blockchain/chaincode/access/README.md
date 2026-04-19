# chaincode/access — ACCESS_PERMISSION_ENFORCER

Hyperledger Fabric chaincode (Go) that enforces role-based access and logs every query to the immutable ledger.

## Access Matrix

This contract runs on every API request. No query reaches citizen data without passing through it.

| Caller Role | What They Can Access |
|---|---|
| PUBLIC | Public officials only — asset categories and totals, no exact amounts |
| CITIZEN | Own profile only — full asset detail, ZKP results, access log |
| OFFICER (with investigation ref) | Income summary + asset summary for any citizen |
| BANK (with citizen consent token) | Credit score only |
| COURT (with court order number) | Full disclosure |
| ADMIN | System metadata, agency status — not citizen financial data |

## Access Log

Every access — whether granted or denied — is written to the ledger:

```json
{
  "timestamp": "2026-04-20T09:14:33Z",
  "caller_id": "OFF-DL-00142",
  "caller_role": "OFFICER",
  "citizen_node_id": "BSC-POL-001",
  "query_type": "ASSET_SUMMARY",
  "investigation_ref": "INV-2026-00891",
  "access_granted": true
}
```

This log is append-only. It cannot be deleted by any role, including ADMIN.

## Files

| File | Purpose |
|---|---|
| `access.go` | Main chaincode — CheckPermission, LogAccess, NotifyCitizen |
| `access_test.go` | Unit tests — every role × every query type combination |
| `keys.go` | Ledger key schema |
| `types.go` | Go structs for access log entries, permission rules |
| `go.mod` | Go module definition |

## Running Tests

```bash
go test ./... -v
```

## Citizen Notification

When an OFFICER accesses a citizen profile, this contract emits a Fabric event that the API subscribes to. The API then sends a notification to the citizen. The notification record is also written on-chain — the citizen can verify it was sent even if the notification delivery failed.
