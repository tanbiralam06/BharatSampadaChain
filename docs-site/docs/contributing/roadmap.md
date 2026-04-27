---
id: roadmap
title: Roadmap
sidebar_label: Roadmap
pagination_next: null
---

# Bharat Sampada Chain (BSC) — Development Roadmap

> This roadmap is public, versioned, and community-driven. Every phase target is a commitment, not a wish list. Status is updated on every significant merge to `main`.

---

## Current Status

| Phase | Name | Status | Target |
|---|---|---|---|
| Phase 0 | Proof of Concept | ✅ Complete | Q1 2026 |
| Phase 1 | Core Infrastructure | 🔄 In Progress | Q3 2026 |
| Phase 2 | Agency Integration | 🔲 Planned | Q1 2027 |
| Phase 3 | ZKP & Privacy Layer | 🔲 Planned | Q3 2027 |
| Phase 4 | Production Hardening | 🔲 Planned | Q1 2028 |

**Legend:** ✅ Complete · 🔄 In Progress · 🧪 Testing · 🔲 Planned · ⏸ Paused · ❌ Dropped

---

## Phase 0 — Proof of Concept
**Status: ✅ Complete**
**Timeline: January 2026 – March 2026**

The goal of Phase 0 was to demonstrate that BSC is technically feasible, visually credible, and policy-sound — without writing a single line of production code.

### Deliverables

- [x] Product Requirements Document (PRD)
- [x] Whitepaper (`WHITEPAPER.md`) — formal academic/policy document
- [x] Open source strategy — zero-cost stack selection (Hyperledger Fabric + circom + snarkjs)
- [x] React prototype — 4 dashboards, 15 screens, realistic dummy data (`bsc-prototype/`)
- [x] Adaptation guide for other jurisdictions (`ADAPTATION_GUIDE.md`)
- [x] Repository README (`README.md`)
- [x] This roadmap (`ROADMAP.md`)

### What Phase 0 Proves

1. The system architecture is sound — four roles, four smart contracts, ZKP queries map cleanly to real investigation workflows.
2. The UI/UX is functional — investigators, citizens, and public users have genuinely different dashboards with the right information density.
3. The open source strategy is zero-cost — every component has a free, production-grade alternative.
4. The policy argument is complete — the whitepaper provides legal, economic, and governance justification that decision-makers can act on.

### What Phase 0 Does NOT Prove

- Real blockchain integration (prototype uses dummy JSON, not Hyperledger Fabric)
- Real ZKP computation (prototype shows conceptual flows, not actual circom circuits)
- Real agency data integration (MCA, IT Department, Registration)
- Production security (no penetration testing performed)

---

## Phase 1 — Core Infrastructure
**Status: 🔄 In Progress**
**Timeline: April 2026 – September 2026**
**Milestone: Working blockchain + API + database, no agency data yet**

Phase 1 builds the real technical foundation. By the end of Phase 1, a developer must be able to run `docker compose up` and get a fully functional local BSC network with all smart contracts deployed, all API endpoints live, and real data flowing from seeded test accounts.

### 1.1 Hyperledger Fabric Network

| Task | Priority | Status |
|---|---|---|
| Local Fabric testnet — 3 peer nodes, 1 orderer | P0 | 🔲 |
| 3 organisations: IT-Dept-MSP, Registrar-MSP, MCA-MSP | P0 | 🔲 |
| Channel configuration: `bsc-main-channel` | P0 | 🔲 |
| TLS certificates via cryptogen | P0 | 🔲 |
| Anchor peer configuration for gossip | P1 | 🔲 |
| Docker Compose file for entire Fabric network | P0 | 🔲 |
| Fabric Explorer integration (block explorer UI) | P2 | 🔲 |

### 1.2 Smart Contracts (Chaincode — Go)

Four contracts must be written, tested, and deployed on the testnet.

**Contract 1: `WealthAnomalyDetector`**

| Task | Priority | Status |
|---|---|---|
| Income-Asset Mismatch rule (YELLOW) | P0 | 🔲 |
| Serious Unexplained Wealth rule (RED) | P0 | 🔲 |
| Public Official Wealth Surge rule (RED) | P0 | 🔲 |
| Benami Suspicion rule (ORANGE) | P0 | 🔲 |
| Shell Company Link rule (ORANGE) | P0 | 🔲 |
| Threshold config — governable via governance contract | P1 | 🔲 |
| Unit tests — 100% rule coverage | P0 | 🔲 |
| Integration tests — test against seeded ledger | P0 | 🔲 |

**Contract 2: `PropertyTransferValidator`**

| Task | Priority | Status |
|---|---|---|
| Property registration recording | P0 | 🔲 |
| Transfer history immutable chain | P0 | 🔲 |
| Undervaluation detection vs. circle rate | P1 | 🔲 |
| Rapid flip detection (< 90 days) | P1 | 🔲 |
| Cross-state duplicate property detection | P2 | 🔲 |
| Unit tests — all edge cases | P0 | 🔲 |

**Contract 3: `AccessPermissionEnforcer`**

| Task | Priority | Status |
|---|---|---|
| Role-based access matrix (PUBLIC / CITIZEN / OFFICER / ADMIN) | P0 | 🔲 |
| Access log — every query recorded on-chain | P0 | 🔲 |
| Citizen notification trigger on OFFICER access | P0 | 🔲 |
| Investigation reference number generation | P1 | 🔲 |
| Access expiry for time-limited officer queries | P2 | 🔲 |
| Unit tests | P0 | 🔲 |

**Contract 4: `ZKPVerifier`**

| Task | Priority | Status |
|---|---|---|
| Groth16 proof verification on-chain | P0 | 🔲 |
| Accept proof + public inputs, return VALID/INVALID | P0 | 🔲 |
| Store proof hash + timestamp on ledger | P0 | 🔲 |
| Prevent proof replay attacks | P1 | 🔲 |
| Unit tests | P0 | 🔲 |

### 1.3 PostgreSQL Schema + Seeder

| Task | Priority | Status |
|---|---|---|
| Schema design: citizens, assets, properties, flags, access_logs | P0 | 🔲 |
| Flyway migration files | P1 | 🔲 |
| Seeder script — 50 realistic Indian citizen records | P0 | 🔲 |
| Seeder includes: politicians, civil servants, private citizens | P0 | 🔲 |
| Index strategy — fast search by name, PAN hash, constituency | P1 | 🔲 |
| Sync mechanism — ledger writes trigger PostgreSQL index update | P1 | 🔲 |

### 1.4 Node.js API Gateway

| Task | Priority | Status |
|---|---|---|
| Express + TypeScript project setup | P0 | 🔲 |
| JWT authentication middleware | P0 | 🔲 |
| Role guard middleware | P0 | 🔲 |
| Fabric SDK integration (Node.js Fabric Gateway SDK) | P0 | 🔲 |
| `/api/v1/citizens` — search, filter, paginate | P0 | 🔲 |
| `/api/v1/citizens/:id` — profile by node ID | P0 | 🔲 |
| `/api/v1/citizens/:id/assets` | P0 | 🔲 |
| `/api/v1/citizens/:id/properties` | P0 | 🔲 |
| `/api/v1/flags` — anomaly flag list | P0 | 🔲 |
| `/api/v1/flags/:id` — flag detail | P0 | 🔲 |
| `/api/v1/zkp/prove` — generate ZKP proof | P1 | 🔲 |
| `/api/v1/zkp/verify` — verify proof against chain | P1 | 🔲 |
| `/api/v1/access-log` — officer access history | P0 | 🔲 |
| `/api/v1/admin/system-health` | P0 | 🔲 |
| `/api/v1/admin/agencies` — agency sync status | P1 | 🔲 |
| Rate limiting — per role, per endpoint | P1 | 🔲 |
| Request logging — structured JSON via Winston | P1 | 🔲 |
| OpenAPI spec (`docs/api.yaml`) | P1 | 🔲 |
| API tests — Jest + Supertest | P0 | 🔲 |

### 1.5 Docker Compose Integration

| Task | Priority | Status |
|---|---|---|
| Single `docker-compose.yml` — all services | P0 | 🔲 |
| Services: Fabric peer × 3, orderer, CouchDB × 3, PostgreSQL, Redis, API, Frontend | P0 | 🔲 |
| Health checks for all containers | P1 | 🔲 |
| Volume mounts for data persistence | P1 | 🔲 |
| `make setup` command — first-time Fabric channel creation + chaincode deploy | P0 | 🔲 |
| `make seed` command — seed PostgreSQL with dummy data | P0 | 🔲 |
| `make reset` command — wipe and rebuild | P1 | 🔲 |

### Phase 1 Exit Criteria

Before Phase 2 begins, the following must be true:

- [ ] `docker compose up` starts all services without errors on macOS, Linux, and Windows (WSL2)
- [ ] All 4 smart contracts deployed and callable via API
- [ ] All API endpoints return data from the real Fabric ledger (not mocked)
- [ ] 50 seeded citizens visible in PostgreSQL and queryable via API
- [ ] Access log records every query on-chain
- [ ] Citizen receives notification record when officer accesses their profile
- [ ] All unit tests pass (target: 80% code coverage minimum)
- [ ] API documented in `docs/api.yaml`

---

## Phase 2 — Agency Integration
**Status: 🔲 Planned**
**Timeline: October 2026 – March 2027**
**Milestone: Real (or simulated-real) data ingestion from 3 government agencies**

Phase 2 solves the hardest non-technical problem in BSC: connecting to actual data sources. Since real government APIs require MoUs and policy approval, Phase 2 builds the integration layer against realistic simulated agency APIs — identical to real API contracts but serving synthetic data.

### 2.1 IT Department Integration (Income Tax Returns)

| Task | Priority | Status |
|---|---|---|
| IT Dept. API contract — document the real API schema | P0 | 🔲 |
| Mock IT Dept. server — Express, identical response schema | P0 | 🔲 |
| Ingestion job — poll mock IT server, write to Fabric | P0 | 🔲 |
| Data hash before storage — SHA-256 of Aadhaar/PAN | P0 | 🔲 |
| Failure handling — retry with exponential backoff | P1 | 🔲 |
| Reconciliation job — detect out-of-sync records | P2 | 🔲 |

### 2.2 Property Registrar Integration

| Task | Priority | Status |
|---|---|---|
| Registrar API contract — document schema | P0 | 🔲 |
| Mock Registrar server | P0 | 🔲 |
| Property ingestion job — new registrations + transfers | P0 | 🔲 |
| Circle rate comparison logic | P1 | 🔲 |
| State-wise circle rate table (28 states) | P2 | 🔲 |

### 2.3 MCA Integration (Ministry of Corporate Affairs)

| Task | Priority | Status |
|---|---|---|
| MCA21 API contract | P0 | 🔲 |
| Mock MCA server | P0 | 🔲 |
| Director-company linkage ingestion | P0 | 🔲 |
| Shell company flag trigger — >5 shell links | P1 | 🔲 |

### 2.4 Anomaly Engine

| Task | Priority | Status |
|---|---|---|
| Real-time anomaly scoring — triggered on every data write | P0 | 🔲 |
| Flag severity recalculation on new data | P0 | 🔲 |
| Anomaly history — track flag changes over time | P1 | 🔲 |
| Threshold governance — update thresholds via admin | P1 | 🔲 |
| Bulk re-scoring job — for threshold changes | P2 | 🔲 |

### 2.5 Notification System

| Task | Priority | Status |
|---|---|---|
| Citizen notification on officer access — email/SMS mock | P0 | 🔲 |
| Notification log on-chain (tamper-proof) | P0 | 🔲 |
| Citizen dashboard — notification history | P1 | 🔲 |
| Officer action notification to citizen (escalation) | P2 | 🔲 |

### Phase 2 Exit Criteria

- [ ] All 3 agency mock servers running and integrated
- [ ] Data flows: agency mock → ingestion job → Fabric ledger → PostgreSQL index → API → frontend
- [ ] Anomaly engine recalculates flags on every data write
- [ ] Citizens notified (via mock notification service) on officer access
- [ ] Integration test suite covering all data flows (target: 70% coverage)

---

## Phase 3 — ZKP & Privacy Layer
**Status: 🔲 Planned**
**Timeline: April 2027 – September 2027**
**Milestone: Real circom circuits generating verifiable proofs on actual citizen data**

Phase 3 implements the cryptographic privacy guarantees that make BSC unique. This is the hardest engineering phase. ZKP development requires a developer who understands modular arithmetic and R1CS constraint systems — allocate accordingly.

### 3.1 ZKP Circuit Development (circom)

**Circuit 1: Range Proof — Net Worth Threshold**

```
Query: "Does citizen's net worth exceed ₹X?"
Input: net_worth (private), threshold (public)
Output: YES / NO
Difficulty: Beginner
```

| Task | Priority | Status |
|---|---|---|
| Circuit design — `net_worth_range.circom` | P0 | 🔲 |
| Trusted setup — Powers of Tau ceremony reuse | P0 | 🔲 |
| Groth16 proof key generation (`zkey`) | P0 | 🔲 |
| Verification key export | P0 | 🔲 |
| snarkjs integration — proof generation in Node.js | P0 | 🔲 |
| On-chain verification — ZKPVerifier chaincode | P0 | 🔲 |
| Test: prove net worth > ₹1 Crore without revealing ₹3.8 Crore | P0 | 🔲 |

**Circuit 2: Ratio Comparison — Income Consistency**

```
Query: "Is declared income consistent with asset growth?"
Input: income_5yr (private), asset_growth (private), ratio_threshold (public)
Output: YES / NO (is the ratio within expected bounds?)
Difficulty: Beginner
```

| Task | Priority | Status |
|---|---|---|
| Circuit design — `income_consistency.circom` | P0 | 🔲 |
| Handle division safely (no floating point in ZKP) | P0 | 🔲 |
| Groth16 setup | P0 | 🔲 |
| Integration test | P0 | 🔲 |

**Circuit 3: Membership Proof — Property Ownership by State**

```
Query: "Does citizen own property in State X?"
Input: property_list (private), state_id (public)
Output: YES / NO
Difficulty: Intermediate
```

| Task | Priority | Status |
|---|---|---|
| Circuit design — `state_membership.circom` | P0 | 🔲 |
| Merkle tree membership proof approach | P1 | 🔲 |
| Handle variable-length property list | P1 | 🔲 |
| Groth16 setup | P0 | 🔲 |
| Integration test | P0 | 🔲 |

**Circuit 4: Multi-point Comparison — Wealth Growth Rate**

```
Query: "Did wealth grow more than X% in Y years?"
Input: wealth_t0 (private), wealth_tN (private), growth_threshold (public), years (public)
Output: YES / NO
Difficulty: Intermediate
```

| Task | Priority | Status |
|---|---|---|
| Circuit design — `growth_rate.circom` | P0 | 🔲 |
| Multi-year interpolation in constraints | P1 | 🔲 |
| Overflow protection for large INR amounts | P0 | 🔲 |
| Groth16 setup | P0 | 🔲 |
| Integration test | P0 | 🔲 |

### 3.2 ZKP API Integration

| Task | Priority | Status |
|---|---|---|
| `/api/v1/zkp/prove` — accept query params, return proof | P0 | 🔲 |
| Proof generation runs off-chain (Node.js worker thread) | P0 | 🔲 |
| `/api/v1/zkp/verify` — verify proof, record on-chain | P0 | 🔲 |
| Proof caching — Redis, TTL 24 hours | P1 | 🔲 |
| Officer dashboard — ZKP query interface | P0 | 🔲 |

### 3.3 Data Minimization Audit

| Task | Priority | Status |
|---|---|---|
| Audit: confirm no raw Aadhaar/PAN stored anywhere | P0 | 🔲 |
| Audit: confirm no exact balance amounts on-chain | P0 | 🔲 |
| Confirm: only balance ranges stored (₹10L–50L, etc.) | P0 | 🔲 |
| DPDPA 2023 compliance checklist | P0 | 🔲 |
| Data retention policy — implement auto-expiry for access logs | P1 | 🔲 |

### Phase 3 Exit Criteria

- [ ] All 4 circom circuits compile, prove, and verify
- [ ] ZKP proofs verified by `ZKPVerifier` chaincode on-chain
- [ ] No raw Aadhaar, PAN, or exact wealth figures stored anywhere in the system
- [ ] Officer dashboard shows ZKP YES/NO queries with proof hash
- [ ] Proof generation under 5 seconds on standard hardware
- [ ] ZKP module has its own test suite (`zkp/tests/`)

---

## Phase 4 — Production Hardening
**Status: 🔲 Planned**
**Timeline: October 2027 – March 2028**
**Milestone: System is ready for institutional security audit and pilot deployment**

Phase 4 is not about new features. It is about making everything that exists safe, reliable, and auditable enough for a real government pilot.

### 4.1 Security

| Task | Priority | Status |
|---|---|---|
| Penetration test — engage external security firm or IIT research group | P0 | 🔲 |
| Smart contract audit — formal verification of all 4 chaincode contracts | P0 | 🔲 |
| ZKP circuit audit — verify constraint soundness | P0 | 🔲 |
| API security audit — OWASP Top 10 | P0 | 🔲 |
| Key management — HSM integration for Fabric MSP keys | P1 | 🔲 |
| Secrets management — move from .env to Vault / AWS Secrets Manager | P1 | 🔲 |
| Supply chain audit — all npm and Go dependencies | P1 | 🔲 |
| CVE monitoring — Dependabot + Snyk integration | P2 | 🔲 |

### 4.2 Performance

| Task | Priority | Status |
|---|---|---|
| Load test — Fabric network at 1,000 TPS | P0 | 🔲 |
| Load test — API at 10,000 concurrent requests | P0 | 🔲 |
| ZKP proof generation benchmark — target < 3 seconds | P1 | 🔲 |
| PostgreSQL query optimization — EXPLAIN ANALYZE all slow queries | P1 | 🔲 |
| Caching audit — Redis hit rate > 90% for public dashboard | P2 | 🔲 |

### 4.3 Reliability

| Task | Priority | Status |
|---|---|---|
| Disaster recovery plan — documented + tested | P0 | 🔲 |
| Backup strategy — PostgreSQL daily snapshots + Fabric block archive | P0 | 🔲 |
| Node failover test — kill one Fabric peer, verify network continues | P1 | 🔲 |
| Health check endpoints for all services | P0 | 🔲 |
| Alerting — Prometheus + Grafana dashboards for all services | P1 | 🔲 |
| SLA definition — 99.9% uptime target | P2 | 🔲 |

### 4.4 Observability

| Task | Priority | Status |
|---|---|---|
| Structured logging — all services emit JSON logs | P0 | 🔲 |
| Distributed tracing — OpenTelemetry across API + Fabric SDK | P1 | 🔲 |
| Metrics — Prometheus scraping from all services | P1 | 🔲 |
| Dashboard — Grafana board with key BSC metrics | P2 | 🔲 |
| Audit log — immutable access log exportable for judicial review | P0 | 🔲 |

### 4.5 Documentation for Pilot

| Task | Priority | Status |
|---|---|---|
| Deployment guide — `docs/deployment.md` (cloud + on-prem) | P0 | 🔲 |
| Operations runbook — `docs/runbook.md` | P0 | 🔲 |
| API reference — published OpenAPI at `/docs` | P0 | 🔲 |
| Legal compliance report — DPDPA, PMLA, Right to Privacy | P0 | 🔲 |
| User manual — for IT officers and citizen portal | P1 | 🔲 |
| Training materials — for agency administrators | P2 | 🔲 |

### Phase 4 Exit Criteria

- [ ] External security audit completed, all critical findings resolved
- [ ] Smart contract formal verification complete
- [ ] System handles 1,000 TPS on Fabric network
- [ ] Zero raw personal data (Aadhaar/PAN) anywhere in the system — verified by audit
- [ ] Disaster recovery tested — RTO < 4 hours, RPO < 1 hour
- [ ] All documentation complete — deployment, operations, legal compliance
- [ ] System ready for submission to NIC / UIDAI / Finance Ministry for pilot evaluation

---

## Beyond Phase 4 — Future Considerations

These are not committed roadmap items. They are ideas worth tracking.

| Idea | Rationale | Complexity |
|---|---|---|
| **Mobile citizen app** (React Native) | Increase citizen access on mobile-first India | Medium |
| **State government portal** | Each state gets their own scoped dashboard | Medium |
| **Court-admissible export format** | ZKP proof + audit trail packaged for judicial submission | High |
| **Multilingual support** | Hindi, Tamil, Telugu, Bengali, Kannada | Medium |
| **Biometric verification layer** | Link with Aadhaar biometric for citizen portal login | High |
| **Cross-border adaptation** | Package for UN / UNDP distribution to other democracies | Medium |
| **Academic dataset** | Fully synthetic anonymised dataset for research | Low |
| **AI anomaly detection** | ML model running alongside rule-based engine | High |

---

## How to Influence This Roadmap

BSC is open source and the roadmap is not set in stone. If you are a developer, researcher, government official, or civic organisation:

1. **Open an Issue** — tag it `roadmap` and describe what you want added, changed, or deprioritised.
2. **Start a Discussion** — use GitHub Discussions for broader architectural questions.
3. **Submit a PR** — small, focused PRs are always welcome. See [CONTRIBUTING.md](/docs/contributing/index).
4. **Email the maintainer** — for institutional partnerships, pilot proposals, or security disclosures.

Priorities shift based on: community demand, institutional partnerships, security findings, and legal developments in Indian data protection law.

---

## Version History

| Version | Date | Change |
|---|---|---|
| v0.1 | April 2026 | Initial roadmap published with Phase 0 complete |

---

*Bharat Sampada Chain — Built by Citizens, For Citizens. Jai Hind.*
