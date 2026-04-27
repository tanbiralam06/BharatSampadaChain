---
id: anomaly
title: Anomaly Chaincode
sidebar_label: Anomaly Detector
---

# Anomaly Chaincode

**Source:** `blockchain/chaincode/anomaly/` · **Version:** v1.1 · **Language:** Go

The anomaly chaincode stores citizen identity nodes and evaluates wealth anomaly rules automatically on every update.

---

## State Keys

| Key Pattern | Type | Description |
|---|---|---|
| `CITIZEN_<hash>` | CitizenNode | Citizen identity + asset figures |
| `FLAG_<hash>_<txId[:8]>` | AnomalyFlag | Immutable anomaly flag record |

---

## Data Structures

### CitizenNode

```go
type CitizenNode struct {
    CitizenHash          string  // SHA-256 hex identifier
    PANHash              string  // SHA-256 of PAN number
    Name                 string
    DateOfBirth          string
    AadhaarState         string
    CitizenType          string  // "civilian" | "government_official" | "politician"
    TotalDeclaredAssets  int64   // paisa
    TotalIncome5Yr       int64   // paisa — sum of last 5 years ITR
    PrevYearAssets       int64   // paisa — assets at end of previous year
    Assets5YrAgo         int64   // paisa — assets 5 years ago
    AnomalyScore         int     // 0=CLEAR, 1=YELLOW, 2=ORANGE, 3=RED
    CreatedAt            string
    UpdatedAt            string
}
```

### AnomalyFlag

```go
type AnomalyFlag struct {
    FlagID          string
    CitizenHash     string
    RuleTriggered   string  // see rule list below
    Severity        string  // "YELLOW" | "ORANGE" | "RED"
    Description     string
    AssetValueUsed  int64   // paisa
    IncomeValueUsed int64   // paisa
    GapAmount       int64   // paisa
    Status          string  // "OPEN" | "UNDER_INVESTIGATION" | "CLEARED" | "ESCALATED"
    CreatedAt       string
    UpdatedAt       string
    ResolutionNotes string
}
```

---

## Exported Functions

### `CreateCitizenNode`

Registers a new citizen on the ledger. Fails if the hash already exists.

**Parameters:** citizenHash, panHash, name, dob, state, citizenType, totalAssets, totalIncome5Yr, prevYearAssets, assets5YrAgo

### `UpdateCitizenAssets`

Updates asset figures for an existing citizen. Triggers `RunAnomalyCheck` automatically.

### `RunAnomalyCheck`

Evaluates three automatic rules against the citizen's current figures and writes flags for any triggered rules.

| Rule | Severity | Trigger Condition |
|---|---|---|
| `INCOME_ASSET_MISMATCH` | YELLOW | `totalAssets > totalIncome5Yr * 2` |
| `UNEXPLAINED_WEALTH` | ORANGE | `totalAssets > totalIncome5Yr * 3` |
| `OFFICIAL_WEALTH_SURGE` | RED | politician/official AND `totalAssets > totalIncome5Yr * 5` |

### `SubmitManualFlag`

Writes a manual anomaly flag without re-running automatic rules. Used by the API's benami detection service and bank discrepancy reporting.

**Parameters:** citizenHash, ruleTriggered, severity, description, assetValue, incomeValue, gapAmount

Rules used via `SubmitManualFlag`:
- `PROXY_OWNERSHIP_PATTERN` (ORANGE) — multiple low-income relatives hold significant property
- `SYSTEMATIC_UNDERVALUATION` (RED) — repeated property transfers below 80% circle rate
- `DISPROPORTIONATE_ASSETS` (ORANGE) — total assets far exceed declared income
- `UNEXPLAINED_5YR_SURGE` (RED) — massive asset growth in 5 years
- `BANK_DISCREPANCY` (ORANGE) — bank-reported financial anomaly

### `UpdateFlagStatus`

Updates the investigation status of a flag: `OPEN → UNDER_INVESTIGATION → CLEARED | ESCALATED`

### `GetCitizenNode`

Returns the CitizenNode record for a given hash.

### `GetFlagsByCitizen`

Returns all flags for a citizen using a composite key range query.

### `GetFlagsBySeverity`

Returns all flags matching a severity level.

---

## Timestamps

All chaincode timestamps use `txTime(ctx)` — the transaction proposal timestamp from the Fabric ordering service. This is deterministic across all endorsing peers. `time.Now()` is never used.
