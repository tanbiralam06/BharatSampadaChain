# BSC — Implementation Status

> Read this before starting any session. Updated after every significant merge to `main`.
> Last updated: 2026-04-26 · Branch: `main` · Phase: 2 complete → Phase 3 ready (all P1 blockers cleared)

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
| API Gateway | ✅ Running on :4000 | 18 routes live, JWT auth, rate limiting, Winston logging |
| Ledger → PostgreSQL sync | ✅ Done | Service-layer dual-write on every chaincode write |
| Officer access notifications | ✅ Done | `notifyOfficerAccess()` writes to `system_audit` on every non-citizen read |
| API tests | ✅ Done | 40 tests across 6 files (Jest + Supertest), all passing |
| OpenAPI spec | ✅ Done | `docs/api/openapi.yaml` — all endpoints, full schemas, role annotations |
| Rate limiting | ✅ Done | 200 req/15 min global; 20 req/15 min on `/auth` |
| Structured logging | ✅ Done | Winston — colored dev output, JSON in production |
| CORS | ✅ Done | Allows origins on ports 5173–5176 |
| `GET /citizens` list endpoint | ✅ Done | Filters: type, state, search, limit — PostgreSQL mirror |
| `GET /citizens/:hash/financial-assets` | ✅ Done | PostgreSQL off-chain read |
| `POST /auth/guest` | ✅ Done | Issues PUBLIC-role JWT for unauthenticated dashboard |
| Authentication model | ✅ Done | `login_id` column — Aadhaar / email / username; hash resolved server-side |
| Frontend — `citizen-dashboard` | ✅ Built | Port 5174 · 5 pages · JWT auth · React Query · all endpoints wired |
| Frontend — `officer-console` | ✅ Built | Port 5175 · ActiveFlags, CaseInvestigation, FamilyAnalysis |
| Frontend — `admin-panel` | ✅ Built | Port 5176 · SystemHealth (auto-refresh), AgencyManagement, AuditOverview |
| Frontend — `public-dashboard` | ✅ Built | Port 5173 · Guest JWT · BrowseOfficials, OfficialProfile, Compare |
| Frontend — `shared/` | ✅ Built | Types, apiClient, endpoints, formatters, Badge/Card/Spinner/Error/Empty/Hash |
| Dev credentials reference | ✅ Done | `DEV_CREDENTIALS.md` — all seed logins + curl examples |

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
- `login_id` column on `bsc_users` — human-readable credential that resolves to `subject_hash` server-side
- Migrations: `001_initial_schema.sql`, `002_seed_data.sql`, `003_add_login_id.sql`

#### API Gateway (`api/` — TypeScript + Express, port 4000)

| Route | Auth | Who can call |
|---|---|---|
| `POST /auth/login` | Public | Anyone |
| `POST /auth/guest` | Public | Anyone (issues PUBLIC-role JWT) |
| `GET /health` | Public | Anyone |
| `GET /citizens` | JWT | IT_DEPT, ED, CBI, ADMIN, PUBLIC |
| `GET /citizens/:hash` | JWT | Any role; CITIZEN sees own only |
| `POST /citizens` | JWT | ADMIN, IT_DEPT |
| `POST /citizens/:hash/check-anomaly` | JWT | IT_DEPT, ADMIN |
| `GET /citizens/:hash/flags` | JWT | Any role; CITIZEN sees own only |
| `GET /citizens/:hash/access-log` | JWT | Any role; CITIZEN sees own only |
| `GET /citizens/:hash/properties` | JWT | Any role; CITIZEN sees own only |
| `GET /citizens/:hash/financial-assets` | JWT | Any role; CITIZEN sees own only |
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

#### Sync Architecture
- **Pattern**: service-layer dual-write (`void syncX(...)` — best-effort, never throws)
- `syncCitizen`, `syncProperty`, `syncFlag`, `syncFlags`, `syncAccessLog` in `api/src/db/sync.ts`
- `notifyOfficerAccess` writes to `system_audit` with `action = 'OFFICER_ACCESS'` on every non-CITIZEN citizen data read
- `updateFlagStatus` uses a direct SQL partial update (chaincode returns void, no read-back needed)
- Redis cache invalidated on `updateCitizenAssets`

#### Tests (`api/tests/` — Jest + Supertest)
- 40 tests, 6 files, all passing — `npm test` from `api/`
- Covers: health, auth (login + middleware), citizens (RBAC + CRUD + anomaly), properties (register + get + transfer), flags (list + status update + DB sync + manual), admin (health degraded/healthy + stats)
- All Fabric and DB dependencies mocked at the module level — no live services needed

---

### Phase 2 — Frontend (complete)

#### Authentication Model
- `login_id` column added to `bsc_users` — decouples login credential from blockchain identity
- Citizens log in with their **12-digit Aadhaar number**
- Officers log in with their **government email address**
- Admin logs in with a **username**
- `subject_hash` (blockchain key) is resolved server-side after credential check — never typed by users
- JWT `sub` claim, all API routes, and all chaincode interactions are unchanged

#### Frontend Apps (npm workspaces — `frontend/`)

| App | Port | Role | Pages |
|---|---|---|---|
| `public-dashboard` | 5173 | PUBLIC (guest JWT, no login) | BrowseOfficials, OfficialProfile, Compare |
| `citizen-dashboard` | 5174 | CITIZEN | Overview, Properties, Financial Assets, Access Log, Flags |
| `officer-console` | 5175 | IT_DEPT / ED / CBI | ActiveFlags, CaseInvestigation, FamilyAnalysis |
| `admin-panel` | 5176 | ADMIN | SystemHealth, AgencyManagement, AuditOverview |

#### Shared Library (`frontend/shared/`)
- TypeScript interfaces mirroring all chaincode and API models
- Typed axios client — reads JWT from `sessionStorage`, 401 → redirect to login
- All API endpoint functions with full return types
- Formatters: `formatCrore` (paisa → crore/lakh/rupee), `formatDate`, `formatHash`
- Components: `Badge`, `Card`, `Spinner`, `ErrorBanner`, `EmptyState`, `HashDisplay`

---

## Running the Stack

```bash
# First-time setup
docker compose -f docker/docker-compose.yml --project-name bsc up -d --build
bash blockchain/scripts/deploy-chaincode.sh

# Subsequent restarts
docker compose -f docker/docker-compose.yml --project-name bsc up -d

# Rebuild API after code changes
docker stop bsc-api && docker rm bsc-api
docker compose -f docker/docker-compose.yml --project-name bsc up -d --build api --no-deps

# Run API tests (no live services needed)
cd api && npm test

# Frontend — install once after clone
cd frontend && npm install

# Frontend — start each app in a separate terminal
npm run dev:public    # → http://localhost:5173  (no login)
npm run dev:citizen   # → http://localhost:5174  (CITIZEN)
npm run dev:officer   # → http://localhost:5175  (IT_DEPT / ED / CBI)
npm run dev:admin     # → http://localhost:5176  (ADMIN)
```

**Seed credentials** — see `DEV_CREDENTIALS.md` for the full table and curl examples.

| App | Login field | Value |
|---|---|---|
| admin-panel | Username | `admin` |
| officer-console | Email | `rajesh.kumar@itdept.bsc.gov` · `priya.sharma@cbi.gov.in` |
| citizen-dashboard | Aadhaar | `123456789012` · `234567890123` · `345678901234` |

Default dev password for all seed users: `password` — **change before any demo**.

---

## What Is NOT Done (Phase 3)

### Must-have before Phase 3

| Task | Priority | Notes |
|---|---|---|
| Chaincode unit tests (Go test files) | ✅ Done | 44 tests across 4 files; CI `chaincode-test` job green |
| `Makefile` with `setup`, `seed`, `reset` targets | ✅ Done | `Makefile` at repo root — `make help` for all targets |
| Anchor peer fix (`MCAmspanchors.tx` typo) | ✅ Done | Fixed `create-channel.sh:108` — was failing silently on Linux |
| Cold-start validation on Linux / macOS | ✅ Done | Validated on WSL2 (Ubuntu) — `make setup` + `make seed` + API health all passed |
| Fabric Explorer block browser UI | P2 | Visibility into raw block data |

### Phase 3 — Advanced Features

| Feature | Notes |
|---|---|
| Real ZKP (Groth16 via circom) | Replace simulated `zkp` chaincode with actual proof verification |
| Aadhaar OTP login (UIDAI sandbox) | Replace static password with one-time passcode for citizens |
| Officer onboarding flow | Admin UI to create officer accounts (sets `login_id` + `subject_hash`) |
| Raft consensus orderer | Replace solo orderer for production fault tolerance |
| NIC / Government SSO integration | Single sign-on for officer roles |
| Admin TOTP (2FA) | Time-based OTP for the ADMIN role |
| Cross-ministry data sharing rules | Fine-grained `access` chaincode permission updates |
| Benami detection (cross-citizen ML rules) | Shell company and proxy ownership analysis |
| Court + Bank role integrations | Court order enforcement, bank-reported discrepancy flags |

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
| `login_id` separate from `subject_hash` | Users authenticate with human-readable credentials; hash is resolved server-side and stays internal |

---

*Bharat Sampada Chain — Built by Citizens, For Citizens. Jai Hind.*
