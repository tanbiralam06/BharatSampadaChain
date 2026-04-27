---
id: property
title: Property Chaincode
sidebar_label: Property Validator
---

# Property Chaincode

**Source:** `blockchain/chaincode/property/` · **Version:** v1.1 (v1.2 ready) · **Language:** Go

The property chaincode manages property registration, ownership transfers, court freeze/unfreeze orders, and enforces undervaluation rules.

---

## State Keys

| Key Pattern | Type | Description |
|---|---|---|
| `PROP_<id>` | PropertyRecord | Current property state |
| `TRANSFER_<id>_<txId>` | TransferRecord | Immutable transfer history |
| `CORDER_<orderId>` | CourtOrder | Court freeze/unfreeze order |
| `PROP_ORDER` composite | — | Index: propertyId → court orders |
| `OWNER_PROP` composite | — | Index: ownerHash → properties |

---

## Data Structures

### PropertyRecord

```go
type PropertyRecord struct {
    PropertyID       string
    OwnerHash        string   // SHA-256 hex
    PrevOwnerHash    string
    RegistrationNo   string
    PropertyType     string   // "residential" | "commercial" | "agricultural" | "industrial" | "plot"
    DeclaredValue    int64    // paisa
    CircleRateValue  int64    // paisa — government reference rate
    AreaSqft         int64
    District         string
    State            string
    RegistrationDate string
    TransferType     string
    StampDutyPaid    int64    // paisa
    Encumbrance      string   // "CLEAR" | "MORTGAGED" | "DISPUTED" | "COURT_STAY"
    MortgageAmount   int64    // paisa
    IsActive         bool
    CreatedAt        string
    UpdatedAt        string
}
```

### CourtOrder

```go
type CourtOrder struct {
    OrderID    string
    PropertyID string
    OrderRef   string   // court case reference, e.g. "HC/2024/CR-5678"
    OrderType  string   // "FREEZE" | "UNFREEZE"
    IssuedBy   string   // officer hash
    Reason     string
    Timestamp  string
}
```

---

## Exported Functions

### `RegisterProperty`

Registers a new property. Enforces the **80% undervaluation rule**:

```
if circleRateValue > 0 and declaredValue < circleRateValue * 0.80:
    → reject with "declared value below 80% of circle rate"
```

### `TransferProperty`

Transfers ownership. Validates:
1. Encumbrance is `CLEAR` — rejects if `COURT_STAY` or `DISPUTED`
2. Transfer value ≥ 80% of circle rate (same undervaluation rule)
3. Appends an immutable `TransferRecord`

### `FreezeProperty`

Issues a court stay order. Sets encumbrance to `COURT_STAY`. Fails if already frozen. Saves a `CourtOrder` record with `OrderType = "FREEZE"`.

### `UnfreezeProperty`

Lifts a court stay. Sets encumbrance back to `CLEAR`. Fails if not currently frozen. Saves a `CourtOrder` record with `OrderType = "UNFREEZE"`.

### `GetCourtOrders`

Returns all court orders for a property (both FREEZE and UNFREEZE history), retrieved via the `PROP_ORDER` composite key index.

### `GetProperty`

Returns the current `PropertyRecord` for a given property ID.

### `GetPropertiesByOwner`

Returns all properties owned by a given owner hash, using the `OWNER_PROP` composite key index.

### `UpdateEncumbrance`

Directly updates encumbrance status and mortgage amount. Used for MORTGAGED and DISPUTED states (not court orders — use FreezeProperty for that).

---

## Upgrading to v1.2

Property v1.2 adds FreezeProperty/UnfreezeProperty/GetCourtOrders. To deploy:

```bash
CC_VERSION=1.2 CC_SEQUENCE=3 CHAINCODES="property" bash blockchain/scripts/deploy-chaincode.sh
```
