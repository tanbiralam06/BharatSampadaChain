---
id: access
title: Access Chaincode
sidebar_label: Access Enforcer
---

# Access Chaincode

**Source:** `blockchain/chaincode/access/` · **Version:** v1.0 · **Language:** Go

The access chaincode does two things: enforces the role-based permission matrix, and records an immutable audit log every time any data is accessed.

---

## State Keys

| Key Pattern | Type | Description |
|---|---|---|
| `LOG_<citizenHash>_<txId>` | AccessLog | Immutable access audit record |
| `PERM_<role>_<dataType>` | PermissionRule | Role permission matrix entry |

---

## Data Structures

### AccessLog

```go
type AccessLog struct {
    LogID            string
    CitizenHash      string
    AccessorHash     string   // officer/admin SHA-256 hash
    AccessorRole     string   // IT_DEPT | ED | CBI | COURT | BANK | ADMIN | PUBLIC
    AccessType       string   // "READ" | "WRITE"
    DataTypes        []string // what fields were accessed
    Purpose          string   // free text
    AuthorizationRef string   // investigation case number
    Timestamp        string
    TxID             string   // Fabric transaction ID
}
```

### PermissionRule

```go
type PermissionRule struct {
    AccessorRole       string
    AllowedDataTypes   []string
    RequiresAuthorizationRef bool
}
```

---

## Exported Functions

### `InitLedger`

Initialises the permission matrix with rules for all 8 roles. Called once on first deploy.

Default rules:
| Role | Allowed Data Types | Requires Case Ref? |
|---|---|---|
| CITIZEN | own profile only | No |
| IT_DEPT | all financial, property, anomaly | Yes |
| ED | all financial, property, anomaly | Yes |
| CBI | all financial, property, anomaly | Yes |
| COURT | property records, court orders | Yes |
| BANK | financial assets | Yes |
| ADMIN | all | No |
| PUBLIC | declared assets (public officials only) | No |

### `CheckPermission`

Evaluates whether a role is allowed to access a given data type. Returns bool.

**Parameters:** accessorRole, dataType, authorizationRef

### `LogAccess`

Writes an immutable access log entry. Called by the API every time a non-citizen role reads citizen data.

**Parameters:** citizenHash, accessorHash, accessorRole, accessType, dataTypesJSON, purpose

### `GetAccessLogsByCitizen`

Returns all access log entries for a given citizen hash (range query on `LOG_<hash>_*`).

### `GetAccessLogsByAccessor`

Returns all access events performed by a given officer hash.

### `GetPermissionRule`

Returns the permission matrix entry for a given role.

### `UpdatePermissionRule`

Updates the allowed data types and `requiresRef` flag for a role. Admin only (enforced at API layer, not chaincode).

---

## Why Access Logging is Non-Negotiable

The access log is the mechanism that prevents BSC from becoming a surveillance tool. Citizens can see exactly who accessed their data, when, for what purpose, and with what case reference.

The API service layer calls `logAccess()` on every non-citizen read. This is not left to individual route handlers — it is enforced in the business logic layer so no endpoint can silently skip it.

If a government officer reads a citizen's full financial profile without logging an investigation reference, that access is still logged — with an empty `authorizationRef` — making the unauthorized access visible in the audit trail.
