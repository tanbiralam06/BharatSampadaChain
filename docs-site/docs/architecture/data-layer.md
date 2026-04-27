---
id: data-layer
title: Data Layer
sidebar_label: Data Layer
---

# Data Layer

BSC uses three data stores. Fabric is the authoritative ledger. PostgreSQL is a fast read mirror. Redis is a session and response cache.

---

## PostgreSQL — Off-Chain Index

PostgreSQL holds a denormalized mirror of the Fabric ledger, optimised for fast queries that would be impractical on the blockchain (full-text search, pagination, multi-field filtering).

**Version:** PostgreSQL 15 · **Port:** 5432

### Tables

| Table | Purpose |
|---|---|
| `bsc_users` | Officer and admin accounts (login_id, role, bcrypt hash) |
| `citizens` | Mirror of CitizenNode records from anomaly chaincode |
| `properties` | Mirror of PropertyRecord from property chaincode |
| `anomaly_flags` | Mirror of AnomalyFlag records |
| `access_logs` | Mirror of access log entries |
| `financial_assets` | Off-chain financial asset data (not on ledger) |
| `system_audit` | Officer access notifications (written on every non-citizen read) |

### Sync Pattern

The API uses a **service-layer dual-write** pattern:
1. Submit transaction to Fabric chaincode (authoritative write)
2. On success, `void syncX(...)` writes to PostgreSQL (best-effort, never throws)

If the PostgreSQL write fails, the Fabric write already succeeded and is permanent. A background reconciliation task (planned) will re-sync on startup.

### What PostgreSQL Does NOT Have

Financial asset data beyond what is explicitly submitted via API. The PostgreSQL mirror only contains what the API has written. Historical chaincode state that was never synced (pre-mirror data) is only on Fabric.

---

## Redis — Cache

**Version:** Redis 7 · **Port:** 6379

Redis caches citizen read responses at the service layer with a 60-second TTL. This significantly reduces Fabric query load on the frequently accessed `/citizens/:hash` endpoint.

Cache keys follow the pattern `citizen:<hash>`. Any write to a citizen record (anomaly check, flag update) invalidates the cache entry.

Redis is optional — the API works without it, just slower. If Redis is unreachable at startup, the API logs a warning and continues.

---

## IPFS — Document Storage

BSC supports linking external documents (property deeds, income certificates) via IPFS. Only the content-addressed CID (hash) is stored on the Fabric ledger. The document itself lives on IPFS.

This keeps the ledger lean while providing tamper-evident document references — if a document is altered, its CID changes.

IPFS integration is not yet wired end-to-end in the current implementation. The schema supports it.

---

## Monetary Values Convention

All monetary values throughout BSC — API, chaincode, database — are stored as **paisa** (integer):

```
1 INR = 100 paisa

₹50,000 = 5,000,000 paisa
₹1 crore = 100,000,000 paisa (10^8)
```

This is stored as `int64` in Go and `BIGINT` in PostgreSQL. The API receives and returns values in paisa. Frontend applications are responsible for display formatting (`₹50,000` or `₹50K`).

**Never use floats for money.** This is enforced throughout the codebase.

---

## Identifier Convention

All citizen, officer, and property identifiers in BSC are **64-character lowercase hex strings** (SHA-256 format):

```
a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
```

Raw Aadhaar numbers and PAN numbers are never stored on the ledger or in PostgreSQL. They are hashed server-side before any storage or comparison.
