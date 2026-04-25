# BSC — Implementation Status

> Read this before starting any session. Updated after every significant merge to `main`.
> Last updated: 2026-04-25 · Branch: `main` · Phase: 2 in progress

---

## Current State at a Glance

| Layer | Status | Notes |
|---|---|---|
| Fabric testnet (3 peers + orderer) | ✅ Running | `bsc-channel` live, TLS enabled |
| Chaincode — `anomaly` | ✅ Deployed v1.1 | 3 auto-rules: YELLOW / ORANGE / RED |
| Chaincode — `property` | ✅ Deployed v1.1 | Registration, transfer, undervaluation flag |
| Chaincode — `access` | ✅ Deployed v1.0 | Permission matrix + immutable access log |
| Chaincode — `zkp` | ✅ Deployed v1.0 | Simulated verification (real circom: Phase 3) |
| PostgreSQL schema | ✅ Live | 7 tables, indexes, 10 seed citizens |
| Redis | ✅ Running | Session cache (60s TTL on citizen reads) |
| API Gateway | ✅ Running on :4000 | All 16 routes live, JWT auth, rate limiting, Winston logging |
| Ledger → PostgreSQL sync | ✅ Done | Service-layer dual-write: every chaincode write mirrors to PostgreSQL immediately |
| Officer access notifications | ✅ Done | `notifyOfficerAccess()` writes to `system_audit` on every non-citizen data read |
| API tests | ✅ Done | 40 tests across 6 files (Jest + Supertest), all passing |
| OpenAPI spec | ✅ Done | `docs/api/openapi.yaml` — all 16 endpoints, full schemas, role annotations |
| Rate limiting | ✅ Done | 200 req/15 min global; 20 req/15 min on `/auth` |
| Structured logging | ✅ Done | Winston — colored dev output, JSON in production |
| Frontend — `citizen-dashboard`  | ✅ Built  | Port 5174 · 5 pages · JWT auth · React Query · all endpoints wired |
| Frontend — `officer-console`    | ✅ Built  | Port 5175 · ActiveFlags, CaseInvestigation (flag actions), FamilyAnalysis |
| Frontend — `admin-panel`        | ✅ Built  | Port 5176 · SystemHealth (auto-refresh), AgencyManagement, AuditOverview |
| Frontend — `public-dashboard`   | ✅ Built  | Port 5173 · Guest JWT · BrowseOfficials, OfficialProfile, Compare |
| Frontend — `shared/`            | ✅ Built  | Types, apiClient, endpoints, formatters, Badge/Card/Spinner/Error/Empty/Hash |
| CORS (API)                      | ✅ Done   | Allows ports 5173–5176 |
| `GET /citizens` list endpoint   | ✅ Done   | Filters: type, state, search, limit — PostgreSQL mirror |
| `GET /citizens/:hash/financial-assets` | ✅ Done | PostgreSQL off-chain read |
| `POST /auth/guest`              | ✅ Done   | Issues PUBLIC-role JWT for unauthenticated dashboard |

---

## What Is Fully Done

### Phase 1 — Core Infrastructure (complete)

#### Hyperledger Fabric Network
- 3 peer orgs: `ITDeptMSP`, `RegistrarMSP`, `MCAMSP` — each with a dedicated peer node
- Solo orderer (`orderer.bsc.gov`) — adequate for Phase 1 testnet
- Channel: `bsc-channel` with MAJORITY endorsement (2 of 3 orgs required per write)
- TLS enabled on all peers and orderer via `cryptogen`
- `deploy-chaincode.sh` is idempotent — safe to re-run

#### Smart Contracts (Go — `blockchain/chaincode/`)

| Chaincode | Version | What it does |
|---|---|---|
| `anomaly` | v1.1 | Stores `CitizenNode` records; auto-runs 3 anomaly rules; raises `AnomalyFlag` (YELLOW/ORANGE/RED); `SubmitManualFlag` for cross-citizen rules |
| `property` | v1.1 | Stores `PropertyRecord`; immutable transfer chain; undervaluation flag vs circle rate |
| `access` | v1.0 | Enforces role-based permission matrix; every data access logged on-chain |
| `zkp` | v1.0 | Accepts proof submissions; stores proof hash + timestamp; prevents replay attacks |

All chaincodes use `txTime(ctx)` — deterministic timestamps across all endorsing peers.

#### PostgreSQL Off-Chain Index (`database/`)
- 7 tables: `bsc_users`, `citizens`, `properties`, `anomaly_flags`, `access_logs`, `financial_assets`, `system_audit`
- Seed data: 3 system users (ADMIN, IT_DEPT, CBI) + 10 citizens across 8 states
- All hashes are valid 64-char hex strings

#### API Gateway (`api/` — TypeScript + Express, port 4000)

| Route | Auth | Who can call |
|---|---|---|
| `POST /auth/login` | Public | Anyone |
| `GET /health` | Public | Anyone |
| `GET /citizens/:hash` | JWT | Any role; CITIZEN sees own only |
| `POST /citizens` | JWT | ADMIN, IT_DEPT |
| `POST /citizens/:hash/check-anomaly` | JWT | IT_DEPT, ADMIN |
| `GET /citizens/:hash/flags` | JWT | Any role; CITIZEN sees own only |
| `GET /citizens/:hash/access-log` | JWT | Any role; CITIZEN sees own only |
| `GET /citizens/:hash/properties` | JWT | Any role; CITIZEN sees own only |
| `POST /properties` | JWT | ADMIN, IT_DEPT |
| `GET /properties/:id` | JWT | Any role |
| `PUT /properties/:id/transfer` | JWT | ADMIN, IT_DEPT |
| `GET /flags` | JWT | IT_DEPT, ED, CBI, ADMIN |
| `PUT /flags/:id` | JWT | IT_DEPT, ED, CBI, ADMIN |
| `POST /flags/manual` | JWT | IT_DEPT, ED, CBI |
| `POST /zkp/:citizenHash` | JWT | Any role |
| `GET /zkp/:citizenHash/claims` | JWT | Any role |
| `GET /admin/health` | JWT | ADMIN only |
| `GET /admin/stats` | JWT | ADMIN only |

Request flow: `routes/` → `services/` → `fabric/contracts.ts` → chaincode, with immediate PostgreSQL mirror write after every chaincode mutation.

#### Sync Architecture
- **Pattern**: service-layer dual-write (`void syncX(...)` — best-effort, never throws)
- `syncCitizen`, `syncProperty`, `syncFlag`, `syncFlags`, `syncAccessLog` in `api/src/db/sync.ts`
- `notifyOfficerAccess` writes to `system_audit` with `action = 'OFFICER_ACCESS'` whenever a non-CITIZEN role reads citizen data
- `updateFlagStatus` uses a direct SQL partial update (chaincode returns void, so no read-back needed)
- Redis cache invalidated on `updateCitizenAssets`

#### Tests (`api/tests/` — Jest + Supertest)
- 40 tests, 6 files, all passing — `npm test` from `api/`
- Covers: health, auth (login + middleware), citizens (RBAC + CRUD + anomaly), properties (register + get + transfer), flags (list + status update + DB sync + manual), admin (health degraded/healthy + stats)
- All Fabric and DB dependencies mocked at the module level — no live services needed

---

## What Is NOT Done (Phase 3)

### Phase 2 Frontend — complete. Pending items before Phase 3:

### Frontend install (run once after clone)

```bash
cd frontend && npm install
```

### Running the frontend apps

```bash
# From frontend/ root (each in a separate terminal):
npm run dev:public    # → http://localhost:5173  (no login required)
npm run dev:citizen   # → http://localhost:5174  (CITIZEN role)
npm run dev:officer   # → http://localhost:5175  (IT_DEPT / ED / CBI)
npm run dev:admin     # → http://localhost:5176  (ADMIN role)
```

### Seed credentials (all use password: `password`)

| App | Name | Hash |
|---|---|---|
| citizen-dashboard | Arjun Mehta | `a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2` |
| citizen-dashboard | Priya Krishnan | `d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6d4e5f6a1b2` |
| officer-console | Rajesh Kumar (IT_DEPT) | `itoff001hashabcdef0123456789abcdef0123456789abcdef0123456789abcd` |
| officer-console | Priya Sharma (CBI) | `cbi001hash0abcdef0123456789abcdef0123456789abcdef0123456789abcde` |
| admin-panel | BSC System Admin | `admin001hashabcdef0123456789abcdef0123456789abcdef0123456789abcd` |

### Nice-to-have before Phase 3

| Task | Priority |
|---|---|
| Chaincode unit tests (Go test files) | P1 |
| `Makefile` with `setup`, `seed`, `reset` targets | P1 |
| Anchor peer configuration (gossip optimisation) | P1 |
| Cold-start validation on Linux / macOS | P1 |
| Fabric Explorer block browser UI | P2 |

---

## Running the Stack

```bash
# First-time setup
docker compose -f docker/docker-compose.yml --project-name bsc up -d --build
bash blockchain/scripts/deploy-chaincode.sh

# Subsequent restarts
docker compose -f docker/docker-compose.yml --project-name bsc up -d

# Run API tests (no live services needed)
cd api && npm test

# Start React prototype (dummy data — not yet wired)
cd bsc-prototype && npm run dev
```

**Login (seed credentials):**
```json
POST http://localhost:4000/auth/login
{ "identifier": "<64-char-hash>", "password": "password", "role": "ADMIN" }
```
Default dev password for all seed users: `password` — **change before any demo**.

---

## Key Architecture Decisions (permanent context)

| Decision | Reason |
|---|---|
| LevelDB instead of CouchDB | 8 GB RAM — CouchDB adds ~3 containers and ~4 GB overhead |
| Solo orderer | Phase 1 testnet only — upgrade to Raft consensus for production |
| MAJORITY endorsement (2 of 3 orgs) | No single ministry can write data unilaterally |
| Service-layer dual-write (not event listener) | No chaincode changes needed; simpler to test; sync is best-effort so failures never block the response |
| ZKP simulated in Phase 1 | Real circom circuits are Phase 3 work |
| `txTime(ctx)` for timestamps | `time.Now()` is non-deterministic across endorsers |
| PostgreSQL as off-chain index | Fabric is source of truth; PostgreSQL is a fast-searchable mirror |
| JWT auth, not sessions | Stateless — trivial to scale |
| `string` fields in chaincode structs | `*string` pointer fields caused proto-marshal errors in `fabric-contract-api-go` |
| All monetary values in paisa | 1 INR = 100 paisa, stored as `int64` — never floats |

---

*Bharat Sampada Chain — Built by Citizens, For Citizens. Jai Hind.*
