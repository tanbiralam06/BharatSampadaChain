# BSC — Implementation Status

> Read this before starting any session. Updated after every significant merge to `main`.
> Last updated: 2026-04-26 · Branch: `main` · Phase: 3 in progress — benami detection complete

---

## Current State at a Glance

| Layer | Status | Notes |
|---|---|---|
| Fabric testnet (3 peers + orderer) | ✅ Running | `bsc-channel` live, TLS enabled |
| Chaincode — `anomaly` | ✅ Deployed v1.1 | 3 auto-rules: YELLOW / ORANGE / RED |
| Chaincode — `property` | ✅ Deployed v1.1 | Registration, transfer, undervaluation flag |
| Chaincode — `access` | ✅ Deployed v1.0 | Permission matrix + immutable access log |
| Chaincode — `zkp` | ✅ Deployed v1.1 | Real Groth16 verification via snarkjs + anti-replay |
| PostgreSQL schema | ✅ Live | 7 tables, indexes, 10 seed citizens |
| Redis | ✅ Running | Session cache (60s TTL on citizen reads) |
| API Gateway | ✅ Running on :4000 | 18 routes live, JWT auth, rate limiting, Winston logging |
| Ledger → PostgreSQL sync | ✅ Done | Service-layer dual-write on every chaincode write |
| Officer access notifications | ✅ Done | `notifyOfficerAccess()` writes to `system_audit` on every non-citizen read |
| API tests | ✅ Done | 94 tests across 11 files (Jest + Supertest), all passing |
| OpenAPI spec | ✅ Done | `docs/api/openapi.yaml` — all endpoints, full schemas, role annotations |
| Rate limiting | ✅ Done | 200 req/15 min global; 20 req/15 min on `/auth` |
| Structured logging | ✅ Done | Winston — colored dev output, JSON in production |
| CORS | ✅ Done | Allows origins on ports 5173–5176 |
| `GET /citizens` list endpoint | ✅ Done | Filters: type, state, search, limit — PostgreSQL mirror |
| `GET /citizens/:hash/financial-assets` | ✅ Done | PostgreSQL off-chain read |
| `POST /auth/guest` | ✅ Done | Issues PUBLIC-role JWT for unauthenticated dashboard |
| Authentication model | ✅ Done | `login_id` column — Aadhaar / email / username; hash resolved server-side |
| Frontend — `citizen-dashboard` | ✅ Built | Port 5174 · 5 pages · JWT auth · React Query · all endpoints wired |
| Frontend — `officer-console` | ✅ Built | Port 5175 · ActiveFlags, CaseInvestigation, FamilyAnalysis, MyTeam |
| Frontend — `admin-panel` | ✅ Built | Port 5176 · SystemHealth, AgencyManagement, OfficerManagement, AuditOverview |
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
| `POST /citizens/:hash/check-benami` | JWT | IT_DEPT, ED, CBI, ADMIN |
| `GET /admin/health` | JWT | ADMIN only |
| `GET /admin/stats` | JWT | ADMIN only |

#### Sync Architecture
- **Pattern**: service-layer dual-write (`void syncX(...)` — best-effort, never throws)
- `syncCitizen`, `syncProperty`, `syncFlag`, `syncFlags`, `syncAccessLog` in `api/src/db/sync.ts`
- `notifyOfficerAccess` writes to `system_audit` with `action = 'OFFICER_ACCESS'` on every non-CITIZEN citizen data read
- `updateFlagStatus` uses a direct SQL partial update (chaincode returns void, no read-back needed)
- Redis cache invalidated on `updateCitizenAssets`

#### Tests (`api/tests/` — Jest + Supertest)
- 82 tests, 10 files, all passing — `npm test` from `api/`
- Covers: health, auth (login + middleware), citizens (RBAC + CRUD + anomaly), properties (register + get + transfer), flags (list + status update + DB sync + manual), admin (health degraded/healthy + stats), officers (RBAC + 409 duplicate + 403 cross-agency), TOTP (all 5 routes + edge cases), permissions (ADMIN-only RBAC + update validation)
- All Fabric and DB dependencies mocked at the module level — no live services needed

---

### Phase 3 — Advanced Features (in progress)

#### Officer Onboarding (complete)
- `POST /admin/officers` — create officer account; ADMIN creates any role, agency officer creates own role only
- `GET /admin/officers` — list officers; ADMIN sees all agencies, agency officer sees own agency only
- `PUT /admin/officers/:hash/status` — activate / deactivate; same scoping rules as above
- `subject_hash` derived as SHA-256 of email — consistent with how citizen hashes are derived from PAN
- Admin panel: **OfficerManagement** page — full table + create modal with all 5 agency roles
- Officer console: **MyTeam** page — same UI scoped to own agency; role field locked to caller's role
- 14 new API tests covering RBAC, duplicate email (409), cross-agency block (403), not-found (404)

#### Admin TOTP 2FA (complete)
- Two-step login: password → `{ step: 'totp_required', challenge_token }` → TOTP code → full JWT
- Challenge token is a short-lived JWT (`purpose: 'totp_challenge'`, 5 min TTL) — stateless, no Redis/DB state
- `POST /auth/totp/setup` — generates TOTP secret, returns `qrCode` (PNG data URL) + `uri` (otpauth://)
- `POST /auth/totp/verify-setup` — validates first code, sets `totp_enabled = true`
- `POST /auth/totp/verify` — exchanges challenge token + live TOTP code for full ADMIN JWT
- `POST /auth/totp/disable` — requires live code; sets `totp_enabled = false`
- `GET /auth/totp/status` — returns `{ enabled: bool }`
- Migration `004_totp.sql`: `totp_secret VARCHAR(64)` + `totp_enabled BOOLEAN DEFAULT false` on `bsc_users`
- Admin panel: two-step **Login** page + **Security** page (enroll/disable with QR code display)
- 15 new API tests (mocked `otplib` + `qrcode`) covering all 5 routes and edge cases

#### Real ZKP — Groth16 via circom + snarkjs (complete)

**Architecture:** `zkp/` is a standalone math module with zero blockchain/API dependency. The API bridges it to the ledger. The chaincode only records attestations — no crypto math on-chain.

- **Circuit** (`zkp/circuits/asset_threshold.circom`) — 304 constraints on BN128 curve
  - Proves: `totalAssets >= threshold` without revealing `totalAssets`
  - Private inputs: `totalAssets` (paisa), `salt` (random nonce)
  - Public inputs: `threshold` (paisa), `commitment` = Poseidon(`totalAssets`, `salt`)
  - Commitment binds the proof to real ledger data — prevents fake inputs
- **Trusted setup** (`zkp/Dockerfile` + `zkp/setup.sh`) — fully local, no external ceremony
  - `docker compose run --rm zkp-setup` (run once from `zkp/`) generates all keys
  - Powers of Tau: local 2^12 ceremony (4096 constraints capacity, circuit uses 304)
  - Outputs: `proving_key.zkey` (185KB), `verification_key.json` (3.1KB), `asset_threshold.wasm` (1.7MB)
  - Keys live in `zkp/keys/` — gitignored, regenerated per developer
- **Prover/verifier** (`api/src/services/zkp.service.ts`) — snarkjs + circomlibjs in Node.js
  - Reads citizen's real `totalDeclaredAssets` from PostgreSQL mirror (never exposed)
  - Generates Groth16 proof, verifies locally, then records attestation on-chain
  - Returns `proofId`, `publicSignals`, `commitment`, `expiresAt` — raw asset value never in response
- **New endpoint** `POST /zkp/:citizenHash/prove` — takes `{ threshold }` in paisa
  - Returns 422 if assets < threshold (circuit constraint fails, proof cannot be generated)
  - Returns 503 if ZKP keys not yet generated (run setup first)
- **Chaincode `zkp` v1.1** — stores proof HASH (SHA-256), not raw proof; anti-replay via `ZKPHASH_` sentinel; rejects unverified proofs
- **Standalone CLI** (`zkp/scripts/prove.js`, `verify.js`) — usable without the API
- **Circuit tests** (`zkp/tests/asset_threshold.test.js`) — 5 tests: valid proof, exact equality, below-threshold fails, tampered signals fail, tampered proof fails

#### Benami Detection (complete)

- `POST /citizens/:hash/check-benami` — ADMIN / IT_DEPT / ED / CBI only; evaluates 4 cross-citizen rules and writes immutable flags on Fabric
- **Rule B1 — Proxy Ownership Pattern** (ORANGE): citizen received 3+ property transfers — typical benami proxy holding pattern
- **Rule B2 — Systematic Undervaluation** (RED): 50%+ of properties declared below 90% of circle rate — benami properties registered cheap to hide value
- **Rule B3 — Disproportionate Assets** (ORANGE): declared assets > 15× annual income — stricter variant of R1 targeting probable benami accumulation
- **Rule B4 — Unexplained 5-Year Surge** (RED): 5-year asset growth > 3× total declared income — wealth accumulation exceeds any plausible legitimate explanation
- Rules evaluate in-process using PostgreSQL mirror data (no chaincode required to evaluate); triggered rules call `SubmitManualFlag` on the anomaly chaincode → written to both Fabric ledger and PostgreSQL
- `api/src/services/benami.service.ts` — standalone service, no cross-service dependencies
- Frontend: officer-console CaseInvestigation page — new **Benami Scan** tab; "Run Scan" button triggers the API, shows per-rule pass/fail breakdown with gap amounts, flags on-chain instantly
- Shared types: `BenamiRuleDetail`, `BenamiScanResult` added to `frontend/shared/src/types.ts`
- Error middleware (`app.ts`) improved: now forwards `err.status` to response code — 404/422/503 errors from services now propagate correctly instead of becoming 500
- 12 new API tests covering RBAC (7 roles), clean citizen (0 flags), risky citizen (4 flags, all rule codes verified), not found (404)

#### Cross-Ministry Permission Matrix (complete)
- `GET /admin/permissions` — returns all 8 role permission rules (Fabric primary, PostgreSQL fallback)
- `PUT /admin/permissions/:role` — updates allowed data types + `requiresRef` flag for one role; writes to Fabric and mirrors to PostgreSQL
- New chaincode functions on `access` v1.1: `GetAllPermissionRules` (range scan over `PERM_*` keys) + `UpdatePermissionRule`
- Migration `005_permissions.sql`: `permission_rules` table pre-seeded with the same 8 rules as `InitLedger`
- Admin panel: **Permissions** page — checkbox grid (roles × data types) with per-row save; unsaved rows highlighted amber
- 13 new API tests covering RBAC (ADMIN-only), unknown role 400, validation errors, happy path update

#### Fabric Graceful Degradation (complete)
- `api/src/utils/fabricErrors.ts` — `isFabricUnavailable()` detects `UNAVAILABLE`, `ECONNREFUSED`, `No connection established`
- All read operations in `flag.service.ts`, `citizen.service.ts`, `property.service.ts` fall back to PostgreSQL mirror when Fabric peer is offline
- Write operations (create citizen, register property, anomaly check) still require Fabric — correct by design
- Redis backoff: exponential retry strategy (2 s → 4 s → … → 30 s cap), gives up after 5 attempts, suppresses duplicate warning logs

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
| Real ZKP (Groth16 via circom) | ✅ Done | asset_threshold circuit, snarkjs prover, anti-replay chaincode — see Phase 3 section above |
| Aadhaar OTP login (UIDAI sandbox) | Replace static password with one-time passcode for citizens |
| Officer onboarding flow | ✅ Done | API + admin-panel OfficerManagement + officer-console MyTeam |
| Raft consensus orderer | Replace solo orderer for production fault tolerance |
| NIC / Government SSO integration | Single sign-on for officer roles |
| Admin TOTP (2FA) | ✅ Done | Two-step login, QR enroll, Security page — see Phase 3 section above |
| Cross-ministry data sharing rules | ✅ Done | Permission matrix API + admin UI — see Phase 3 section above |
| Benami detection (cross-citizen ML rules) | ✅ Done | 4 rules: proxy ownership, systematic undervaluation, disproportionate assets, 5-yr surge — see Phase 3 section above |
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
