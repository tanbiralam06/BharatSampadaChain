# BSC — Implementation Status

> Read this before starting any session. Updated after every significant merge to `main`.
> Last updated: 2026-04-25 · Branch: `main` · Phase: 1 (Core Infrastructure)

---

## Current State at a Glance

| Layer | Status | Notes |
|---|---|---|
| Fabric testnet (3 peers + orderer) | ✅ Running | `bsc-channel` live, TLS enabled |
| Chaincode — `anomaly` | ✅ Deployed v1.1 | 3 auto-rules: YELLOW / ORANGE / RED |
| Chaincode — `property` | ✅ Deployed v1.1 | Registration, transfer, undervaluation |
| Chaincode — `access` | ✅ Deployed v1.0 | Permission matrix + immutable access log |
| Chaincode — `zkp` | ✅ Deployed v1.0 | Simulated verification (real circom: Phase 3) |
| PostgreSQL schema | ✅ Live | 7 tables, indexes, 10 seed citizens |
| Redis | ✅ Running | Session cache |
| API Gateway | ✅ Running on :4000 | All routes live, JWT auth, async error handling |
| Frontend | ⚠️ Disconnected | Prototype uses dummy JSON — not wired to live API |
| Ledger → PostgreSQL sync | ❌ Not implemented | On-chain writes do not update the off-chain index yet |
| Citizen notification on access | ❌ Not implemented | Officer access must trigger notification record |
| API tests | ❌ Not written | Jest + Supertest — Phase 1 exit criterion |
| OpenAPI spec | ❌ Not written | `docs/api.yaml` — Phase 1 exit criterion |

---

## What Is Fully Done

### Hyperledger Fabric Network
- 3 peer orgs: `ITDeptMSP`, `RegistrarMSP`, `MCAMSP` — each with a dedicated peer node
- Solo orderer (`orderer.bsc.gov`) — adequate for Phase 1 testnet, upgrade to Raft for production
- Channel: `bsc-channel` with MAJORITY endorsement (2 of 3 orgs required per write)
- TLS enabled on all peers and orderer via `cryptogen`
- All containers in `bsc-fabric-net` Docker network
- `deploy-chaincode.sh` is idempotent — safe to re-run without errors

### Smart Contracts (Go — `blockchain/chaincode/`)

| Chaincode | Version | What it does |
|---|---|---|
| `anomaly` | v1.1 | Stores `CitizenNode` records; auto-runs 3 anomaly rules on every write; raises `AnomalyFlag` (YELLOW / ORANGE / RED) |
| `property` | v1.1 | Stores `PropertyRecord`; immutable transfer chain; undervaluation flag vs. circle rate |
| `access` | v1.0 | Enforces role-based permission matrix; every data access logged on-chain |
| `zkp` | v1.0 | Accepts proof submissions; stores proof hash + timestamp; prevents replay attacks |

Key fix applied: all chaincodes use `txTime(ctx)` (transaction proposal timestamp) — deterministic across all endorsing peers, unlike `time.Now()`.

### PostgreSQL Off-Chain Index (`database/`)
- 7 tables: `bsc_users`, `citizens`, `properties`, `anomaly_flags`, `access_logs`, `financial_assets`, `system_audit`
- Indexes on high-query columns (citizen type, anomaly score, flag severity, access time)
- Seed data: 3 system users (ADMIN, IT_DEPT, CBI) + 10 citizens across 8 states
- All hashes are valid 64-char hex strings (fixed in latest commit)
- Default dev password for all seed users: `password` (bcrypt hash pre-loaded — **change before any demo**)

### API Gateway (`api/` — TypeScript + Express, port 4000)

| Route | Auth | Who can call |
|---|---|---|
| `POST /auth/login` | Public | Anyone |
| `GET /health` | Public | Anyone |
| `GET /citizens/:hash` | JWT | Role-filtered response |
| `POST /citizens/` | JWT | ADMIN, IT_DEPT |
| `POST /citizens/:hash/check-anomaly` | JWT | IT_DEPT, ADMIN |
| `GET /citizens/:hash/flags` | JWT | All roles (citizen sees own only) |
| `GET /citizens/:hash/access-log` | JWT | All roles (citizen sees own only) |
| `GET /citizens/:hash/properties` | JWT | All roles (citizen sees own only) |
| `GET/POST /properties/` | JWT | Role-filtered |
| `POST /properties/:id/transfer` | JWT | ADMIN, IT_DEPT |
| `GET /flags`, `GET /flags/:id` | JWT | IT_DEPT, ADMIN |
| `PATCH /flags/:id/status` | JWT | IT_DEPT, ADMIN |
| `POST /zkp/prove` | JWT | All roles |
| `POST /zkp/verify` | JWT | All roles |
| `GET /admin/health` | JWT | ADMIN only |
| `GET /admin/stats` | JWT | ADMIN only |

Recent hardening (commit `9fdabd2`):
- All async handlers wrapped with `asyncHandler` — errors propagate to global middleware, no silent crashes
- Fabric connection SSL override uses MSP-derived org domain (not raw peer endpoint)
- `decode()` guards against empty chaincode responses before `JSON.parse`

### Infrastructure
- `docker/docker-compose.yml` — single file for the full stack (fabric + postgres + redis + API)
- Health checks on postgres and redis; API waits for both before starting
- API Docker image builds from source on `docker compose up --build`
- Chaincode containers (`dev-peer0.*`) spawned automatically by Fabric on first invocation

---

## What Is NOT Done (Phase 1 Remaining)

### Must complete before Phase 2 begins

| Task | Why it matters |
|---|---|
| **Ledger → PostgreSQL sync** | The off-chain index is seeded but static — chaincode writes don't update it. Use Fabric event listener (`contract.addContractListener`) in the API or a background worker. |
| **Citizen notification on officer access** | Every time `access/LogAccess` is called by a non-citizen role, a notification record must be written (new `notifications` table or `system_audit`). Surfaced via `GET /citizens/:hash/access-log`. |
| **API tests — Jest + Supertest** | Phase 1 exit criterion. Minimum: auth flow, citizen CRUD, flag lifecycle, ZKP endpoints, health check. Target: 80% route coverage. |
| **OpenAPI spec — `docs/api.yaml`** | Phase 1 exit criterion. Required for agency integration design in Phase 2. Can draft with `ts-to-openapi` or write manually. |
| **Rate limiting** | `express-rate-limit` — per role, per endpoint. Wire in `api/src/index.ts` before route registration. |
| **Structured request logging** | Replace `console.error` with Winston JSON logs. Needed before any load or integration testing. |

### Nice-to-have before Phase 2

| Task | Priority |
|---|---|
| Chaincode unit tests (Go test files in each chaincode dir) | P1 |
| `make setup` / `make seed` / `make reset` Makefile commands | P1 |
| Anchor peer configuration (gossip optimisation) | P1 |
| Cold-start validation on Linux / macOS (currently dev'd on Windows) | P1 |
| Fabric Explorer (block explorer UI) | P2 |

---

## Suggested Next Steps (ordered by impact)

1. **Ledger → PostgreSQL sync** — biggest functional gap right now. Without this, the API serves stale data after any chaincode write. Add a Fabric event listener in `api/src/fabric/connection.ts` that subscribes to `bsc-channel` block events and upserts into PostgreSQL.

2. **Citizen notification** — straightforward once the event listener exists. On each `access/LogAccess` event, insert into `system_audit` with `action = 'OFFICER_ACCESS'` and the citizen hash as `target`.

3. **API tests** — create `api/tests/` with Jest + Supertest. Start with the auth flow and health endpoint, then add one test file per route group.

4. **OpenAPI spec** — draft `docs/api.yaml`. Can be auto-generated from the TypeScript routes as a starting point.

5. **Rate limiting + Winston** — two small installs (`express-rate-limit`, `winston`) wired into `api/src/index.ts`. Unblocks Phase 2 load testing.

---

## Running the Stack

```bash
# First-time setup
docker compose -f docker/docker-compose.yml --project-name bsc up -d --build
bash blockchain/scripts/deploy-chaincode.sh

# Subsequent restarts (stack already deployed)
docker compose -f docker/docker-compose.yml --project-name bsc up -d

# Verify everything is healthy
docker ps --format "table {{.Names}}\t{{.Status}}"

# Tail API logs
docker logs -f bsc-api
```

**Login:** `POST http://localhost:4000/auth/login`
```json
{ "subjectHash": "admin001hashabcdef0123456789abcdef0123456789abcdef0123456789abcd", "password": "password" }
```

---

## Key Architecture Decisions (permanent context)

| Decision | Reason |
|---|---|
| LevelDB instead of CouchDB | 8 GB RAM — CouchDB adds ~3 containers and ~4 GB overhead |
| Solo orderer | Phase 1 testnet only — upgrade to Raft consensus for production |
| MAJORITY endorsement (2 of 3 orgs) | No single ministry can write data unilaterally |
| ZKP simulated in Phase 1 | Real circom circuits are Phase 3 work — Phase 1 only validates the on-chain interface |
| `txTime(ctx)` for timestamps | `time.Now()` is non-deterministic across endorsers — transaction proposal time is identical on all peers |
| PostgreSQL as off-chain index | Fabric ledger is source of truth; PostgreSQL is a fast-searchable mirror for the API layer |
| JWT auth, not sessions | Stateless — trivial to scale across multiple API instances |
| `string` fields in chaincode structs | `*string` pointer fields caused proto-marshal errors in `fabric-contract-api-go` |

---

*Bharat Sampada Chain — Built by Citizens, For Citizens. Jai Hind.*
