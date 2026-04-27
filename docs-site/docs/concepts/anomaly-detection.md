---
id: anomaly-detection
title: Anomaly Detection
sidebar_label: Anomaly Detection
---

# Anomaly Detection

BSC raises anomaly flags automatically when a citizen's declared income and actual asset holdings diverge beyond defined thresholds. No human decides who to flag — the smart contract decides.

---

## Severity Levels

| Severity | Score | Meaning |
|---|---|---|
| YELLOW | 1 | Income-asset gap worth reviewing |
| ORANGE | 2 | Significant unexplained wealth — investigation recommended |
| RED | 3 | Severe anomaly — immediate escalation warranted |

A citizen's `anomalyScore` is the maximum severity across all their open flags.

---

## Automatic Rules (anomaly chaincode)

These run on every `UpdateCitizenAssets` call:

| Rule | Severity | Formula |
|---|---|---|
| `INCOME_ASSET_MISMATCH` | YELLOW | `totalAssets > totalIncome5Yr × 2` |
| `UNEXPLAINED_WEALTH` | ORANGE | `totalAssets > totalIncome5Yr × 3` |
| `OFFICIAL_WEALTH_SURGE` | RED | Politician/official AND `totalAssets > totalIncome5Yr × 5` |

All values are in paisa. The thresholds can be calibrated for different jurisdictions — see the [Adaptation Guide](../adaptation/index).

---

## Manual Flags (via API)

The API layer can submit manual flags for patterns that require cross-citizen analysis (impossible inside a single chaincode call):

| Rule | Severity | Who Can Submit |
|---|---|---|
| `PROXY_OWNERSHIP_PATTERN` | ORANGE | IT_DEPT, ED, CBI |
| `SYSTEMATIC_UNDERVALUATION` | RED | IT_DEPT, ED, CBI |
| `DISPROPORTIONATE_ASSETS` | ORANGE | IT_DEPT, ED, CBI |
| `UNEXPLAINED_5YR_SURGE` | RED | IT_DEPT, ED, CBI |
| `BANK_DISCREPANCY` | ORANGE | BANK only |
| `BENAMI_SUSPICION` | RED | IT_DEPT, ED, CBI |
| `SHELL_COMPANY` | RED | IT_DEPT, ED, CBI |
| `FOREIGN_ASSET_MISMATCH` | ORANGE | IT_DEPT, ED |
| `LIFESTYLE_MISMATCH` | YELLOW | IT_DEPT, ED, CBI |

---

## Benami Detection

Benami detection uses four cross-citizen rules evaluated in the API service layer using PostgreSQL data. When rules trigger, the API submits a manual flag to the anomaly chaincode.

| Rule | What It Detects |
|---|---|
| `PROXY_OWNERSHIP_PATTERN` | Multiple family members or associates with low declared income holding significant property |
| `SYSTEMATIC_UNDERVALUATION` | Repeated property transfers at < 80% of government circle rate |
| `DISPROPORTIONATE_ASSETS` | Total declared assets significantly exceeding all declared income sources |
| `UNEXPLAINED_5YR_SURGE` | Asset base more than doubled in 5 years with no corresponding income growth |

```bash
# Run benami scan (IT_DEPT token required)
curl -X POST http://localhost:4000/citizens/<hash>/check-benami \
  -H "Authorization: Bearer $IT_TOKEN"
```

---

## Undervaluation Rule

The property chaincode enforces an **80% rule** on registration and transfer:

```
if declaredValue < circleRateValue × 0.80 → reject
```

This prevents the classic stamp-duty fraud where a ₹1 crore property is registered at ₹40 lakh to save stamp duty. If `circleRateValue` is 0 (no circle rate data available), the check is skipped.

---

## Flag Lifecycle

```
OPEN → UNDER_INVESTIGATION → CLEARED
                           → ESCALATED
```

Officers can update flag status via `PUT /flags/:id`. Status transitions are logged in the flag record (`updatedAt`, `resolutionNotes`). Cleared flags remain on the ledger permanently — they are not deleted.
