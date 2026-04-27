---
id: identity-model
title: Identity Model
sidebar_label: Identity Model
---

# Identity Model

BSC links every citizen's records through a single cryptographic identity node. The system is designed so that it is useful for investigation and accountability while being structurally incapable of leaking raw identity data.

---

## The CitizenNode

Every person in BSC has exactly one `CitizenNode` on the Fabric ledger. It holds:

| Field | Type | Notes |
|---|---|---|
| `citizenHash` | string (64-char hex) | SHA-256 of Aadhaar + salt |
| `panHash` | string (64-char hex) | SHA-256 of PAN + salt |
| `name` | string | Name as registered |
| `dateOfBirth` | string | ISO date |
| `aadhaarState` | string | State of Aadhaar registration |
| `citizenType` | string | `civilian` · `government_official` · `politician` |
| `totalDeclaredAssets` | int64 | Paisa — total declared value |
| `totalIncome5Yr` | int64 | Paisa — sum of 5 years ITR |
| `prevYearAssets` | int64 | Paisa — previous year assets |
| `assets5YrAgo` | int64 | Paisa — assets 5 years ago |
| `anomalyScore` | int | 0=CLEAR · 1=YELLOW · 2=ORANGE · 3=RED |

---

## Why Hashes Instead of Raw IDs

Raw Aadhaar numbers and PAN numbers are never stored on the ledger or in PostgreSQL. They are hashed with SHA-256 before any storage or comparison.

This means:
- A data breach of the BSC database does not expose anyone's Aadhaar number
- Officers cannot use the system to look up citizens by their biometric ID
- Linkage between records is only possible for the system that knows the pre-image (the API gateway)

The API gateway is the only component that holds the mapping from raw Aadhaar/PAN to citizenHash. This mapping is stored in PostgreSQL's `bsc_users` table, not on the ledger.

---

## What BSC Stores vs Never Stores

| Data Category | What BSC Stores | What BSC Never Stores |
|---|---|---|
| Identity | SHA-256 hash of Aadhaar + name + state + DOB | Raw Aadhaar number |
| Income | Total 5-year income (paisa, range bucket shown to citizen) | Exact annual income breakdown |
| Property | Full property records (area, value, district) | Property documents (stored on IPFS, hash on chain) |
| Net worth | Total declared assets (paisa) | Exact bank balance |
| Flags | Rule triggered, severity, description | Internal investigation notes (those stay in agency systems) |

---

## Net Worth Privacy: Balance Ranges

Citizens viewing their own profile see their net worth as a range, never an exact figure:

| Range Label | Actual Paisa Value |
|---|---|
| Up to ₹10 lakh | `totalDeclaredAssets` < ₹10,00,000 |
| ₹10L – ₹1 Crore | between ₹10,00,000 and ₹1,00,00,000 |
| ₹1 Crore – ₹10 Crore | between ₹1,00,00,000 and ₹10,00,00,000 |
| Above ₹10 Crore | > ₹10,00,00,000 |

Investigators with proper authorization see the precise figure. Citizens and public users see only the range.

This is not a technical limitation — it is a deliberate privacy design choice. A government should know that a politician's wealth grew from ₹2 crore to ₹48 crore in 5 years. A random visitor to the public dashboard should not see the exact number.

---

## Access Logging: The Accountability Mechanism

Every time any government officer reads a citizen's data, an immutable log entry is written to the `access` chaincode:

```json
{
  "logId": "LOG_a1b2c3..._tx00001",
  "citizenHash": "a1b2c3d4...",
  "accessorHash": "f0f1f2f3...",
  "accessorRole": "IT_DEPT",
  "accessType": "READ",
  "dataTypes": ["property", "financial_assets"],
  "purpose": "Benami investigation",
  "authorizationRef": "IT/2024/BN-1234",
  "timestamp": "2024-04-15T10:30:00Z",
  "txId": "abc123..."
}
```

Citizens can retrieve this log at any time and see exactly who accessed their profile, when, and why. This is the primary mechanism that prevents BSC from becoming a surveillance tool — the watcher is always watched.
