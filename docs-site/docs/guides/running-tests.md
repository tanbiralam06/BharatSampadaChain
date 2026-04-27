---
id: running-tests
title: Running Tests
sidebar_label: Running Tests
---

# Running Tests

BSC has three test suites: API tests (Jest + Supertest), Go chaincode tests, and a CI pipeline that runs all three.

---

## API Tests

**Location:** `api/tests/` · **Count:** 120 tests across 13 files · **Framework:** Jest + Supertest

```bash
cd api
npm test

# With coverage report
npm test -- --coverage
```

API tests mock the Fabric gateway but use a real PostgreSQL database. Ensure `bsc-postgres` is running before running tests.

### Test Files

| File | What It Tests |
|---|---|
| `auth.test.ts` | Login, guest token, TOTP setup/verify |
| `citizens.test.ts` | Register, get, list citizens |
| `properties.test.ts` | Register, get, transfer properties |
| `flags.test.ts` | List, update, manual submit flags |
| `zkp.test.ts` | Proof generation and claim retrieval |
| `admin.test.ts` | Health, stats, officer management |
| `benami.test.ts` | 4 benami detection rules |
| `court.test.ts` | Freeze/unfreeze, court order history |
| `bank.test.ts` | Bank discrepancy flag submission |

---

## Go Chaincode Tests

**Location:** `blockchain/chaincode/<name>/` · **Framework:** `testing` + `testify`

```bash
cd blockchain/chaincode/anomaly && go test ./...
cd blockchain/chaincode/property && go test ./...
cd blockchain/chaincode/access && go test ./...
cd blockchain/chaincode/zkp && go test ./...
```

Go tests use `shimtest.MockStub` to simulate the Fabric ledger in-process — no running Fabric network required.

### Property chaincode test count: 21 tests covering
- RegisterProperty (success, duplicate, undervaluation, zero circle rate)
- TransferProperty (success, court stay blocked, disputed blocked, undervaluation blocked)
- FreezeProperty (success, already frozen, blocks transfer)
- UnfreezeProperty (success, not frozen, re-enables transfer)
- GetCourtOrders (empty initially, records full history)

---

## Frontend Type Check

```bash
cd frontend && npm run typecheck
```

Runs `tsc --noEmit` across all 4 apps. No emitted files — just type safety verification.

---

## CI Pipeline

`.github/workflows/ci.yml` runs on every push and PR to `main`:

1. **api-lint** — ESLint + TypeScript type check
2. **api-test** — Jest + Supertest (depends on api-lint)
3. **chaincode-test** — Go tests for all 4 chaincodes (parallel with api-test)
4. **frontend-build** — matrix build of all 4 apps (parallel)

All jobs must pass before a PR can be merged.
