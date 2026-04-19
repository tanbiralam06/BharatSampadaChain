# Bharat Sampada Chain (BSC)

### India's Unified Blockchain Wealth Transparency System

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](https://opensource.org/licenses/MIT)
[![Status: Prototype](https://img.shields.io/badge/Status-Prototype-blue.svg)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-green.svg)](./CONTRIBUTING.md)
[![Whitepaper](https://img.shields.io/badge/Read-Whitepaper-orange.svg)](./WHITEPAPER.md)

---

> **India loses ₹7–10 lakh crore every year to tax evasion, benami property, and welfare fraud.**  
> **Not because the data does not exist — but because nobody connects it.**  
> **BSC connects it.**

---

## What Is BSC?

Bharat Sampada Chain is a permissioned blockchain system that links every Indian citizen's property records, land holdings, financial assets, and business ownership to a single cryptographically verifiable identity node.

When a property is registered, BSC writes it to the ledger. When an ITR is filed, BSC links it to the same identity. When the gap between what someone declared and what they own becomes suspicious, a smart contract raises a flag — automatically, without human discretion, without political interference.

BSC makes wealth opacity structurally difficult. Not through more laws. Through connected data.

**It is fully open source. Every line of code is publicly auditable. A transparency system that is itself opaque would be a contradiction.**

---

## See It Running in 60 Seconds

The prototype runs entirely in your browser with no setup required.

```bash
git clone https://github.com/BharatSampadaChain/bsc.git
cd bsc/bsc-prototype
npm install
npm run dev
```

Open `http://localhost:5173` and select any of the four roles to explore the system.

> **No blockchain required. No configuration. No API keys.**  
> The prototype uses realistic dummy data to demonstrate every feature.

---

## The Four Dashboards

BSC has four role-based interfaces. Each role sees only what it is permitted to see — enforced by smart contract, not policy.

---

### Public Dashboard — No Login Required
*For journalists, activists, researchers, and ordinary citizens*

- Browse all registered politicians and public officials
- View 5-year declared wealth growth timeline for any official
- Compare wealth trajectories of up to 3 officials side by side
- See anomaly flag history for any public official
- Explore national statistics — total flagged cases, recovery estimates, state-by-state breakdown

**Who uses this:** The Wire, NDTV, The Hindu, Association for Democratic Reforms, any citizen curious about their MLA's ₹45 crore net worth on a ₹1.5 lakh monthly salary.

---

### Citizen Dashboard — Aadhaar Login (Simulated)
*For every registered Indian citizen*

- View your complete asset profile — properties, financial assets, investments, business stakes
- See your total estimated net worth range (privacy-preserving — shown as a range, never exact)
- Track every time any government agency accessed your data — who, when, what fields, what purpose
- Understand any anomaly flags raised against you in plain language
- See ZKP verification results — what agencies verified about you without seeing your actual data

**Who uses this:** Any citizen who wants to know what the government sees about them — and who has been looking.

---

### IT Officer Investigation Console — Department Credentials
*For Income Tax Department, ED, CBI, Lokpal investigators*

- Priority queue of all active anomaly flags sorted by severity
- Full case investigation view: income vs. asset gap chart, asset acquisition timeline
- Enter investigation reference number to unlock full citizen asset profile
- Cross-family benami analysis — network view showing wealth concentration across family members
- Action panel: request documents, escalate to ED/CBI, file notes, clear flags
- Every access logged immutably to blockchain with officer ID and investigation reference

**Who uses this:** IT Department officers currently spending 30–180 days manually assembling the same data BSC shows in seconds.

---

### Admin Panel — BSC Authority Only
*For system administrators managing the national infrastructure*

- Real-time blockchain node health — all peer nodes, latency, block height, transaction throughput
- Live transaction feed — every record written to the chain as it happens
- Agency management — enable/disable access for any connected agency
- Data freshness by agency — how stale is each data source
- Audit overview — access patterns, suspicious behaviour alerts, weekly breakdown by agency

---

## The Problem in Numbers

| Metric | Current Reality |
|---|---|
| Annual tax evasion loss | ₹4–6 lakh crore |
| Benami property identified since 2016 | ₹1.3 lakh crore |
| Annual welfare fraud | ₹3 lakh crore |
| Time for manual cross-agency investigation | 30–180 days |
| Disconnected government databases | 5+ (UIDAI, ITR, Land Registry, MCA21, Banks) |
| Politician affidavit format | Scanned PDFs buried on ECI website |
| BSC investigation time | Minutes |

---

## How BSC Works

```
Citizen registers property  →  State land registry writes record to BSC
Citizen files ITR           →  IT Department links filing to BSC identity node
Smart contract runs         →  Compares property value vs. declared income
Gap exceeds threshold       →  Anomaly flag raised automatically
IT Officer opens console    →  Sees complete picture in one place
Citizen logs in             →  Sees that the IT Officer accessed their data
```

No human decided to flag this citizen. The math decided. No human can suppress the access log. The blockchain decided.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                      │
│  Public Dashboard  │  Citizen Portal  │  Officer Console │
│  (React + Vite)    │  (React + Vite)  │  (React + Vite)  │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│                    API GATEWAY LAYER                     │
│         Node.js + TypeScript + Express                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │   Auth   │  │Permission│  │  ZKP     │  │ Access │  │
│  │  (JWT)   │  │Enforcer  │  │ Verifier │  │  Log   │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│                   BLOCKCHAIN LAYER                       │
│              Hyperledger Fabric 2.5                      │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  WEALTH_    │  │  PROPERTY_   │  │    ACCESS_    │  │
│  │  ANOMALY_   │  │  TRANSFER_   │  │  PERMISSION_  │  │
│  │  DETECTOR   │  │  VALIDATOR   │  │   ENFORCER    │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
│                                                          │
│  Peer Node 1    Peer Node 2    Peer Node 3 (Orderer)    │
│  Mumbai DC      Delhi DC       Bengaluru DC              │
└─────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│                    DATA LAYER                            │
│  PostgreSQL         Redis           IPFS                 │
│  (off-chain index)  (cache/session) (documents)          │
└─────────────────────────────────────────────────────────┘
```

**Three layers with a strict hierarchy:**
- No application talks to the blockchain directly — everything goes through the API gateway
- The API gateway enforces permissions via smart contract before returning any data
- Every layer is stateless and horizontally scalable
- Every access, regardless of the result, writes an immutable log entry

---

## The Four Smart Contracts

### WEALTH_ANOMALY_DETECTOR
Runs automatically when a new ITR, property registration, or financial asset is linked to a citizen node.

| Rule | Condition | Flag |
|---|---|---|
| Income Asset Mismatch | Assets acquired > 2× declared income | YELLOW |
| Serious Unexplained Wealth | Net worth > 4× cumulative 5yr income | RED |
| Public Official Wealth Surge | Official's net worth grows >300% in 3 years | RED + Public Dashboard |
| Benami Suspicion | >3 properties in family names, family income <20% of property value | ORANGE |
| Shell Company Link | >5 companies, dormant companies, company revenue < lifestyle | ORANGE |

### PROPERTY_TRANSFER_VALIDATOR
Runs on every property registration before it is written to the ledger.
- Seller must be current owner on BSC — prevents double-selling fraud
- Declared value must be ≥80% of government circle rate — prevents extreme undervaluation
- No existing court stay order on the property
- Seller's identity node must be active

### ACCESS_PERMISSION_ENFORCER
Runs on every single API request. No exceptions.
- Citizen requesting own data → full access
- IT Officer with investigation number → income + asset summary
- Bank with consent token → credit score only
- Court with order number → full disclosure
- Public request for politician → asset categories and totals only
- Public request for private citizen → denied entirely

### ZKP_VERIFIER
Answers YES/NO queries without exposing raw data.
- Does net worth exceed ₹X? → YES / NO
- Is declared income consistent with assets? → CONSISTENT / INCONSISTENT
- Does citizen own property in State X? → YES / NO
- Did wealth grow >X% in Y years? → YES / NO

---

## Zero Knowledge Proof

BSC uses **circom** circuits and **snarkjs** to implement ZKP — the same technology underlying Polygon's privacy infrastructure, used here without any blockchain fees or token requirements.

**What this means practically:**  
A bank can verify your net worth exceeds a loan threshold. They receive `YES`. They never see your actual balance. The proof is cryptographically unforgeable — it cannot say YES if the answer is NO.

The proof is generated on a standard server. Only the proof hash is stored on-chain. No gas fees. No tokens. No public chain.

---

## Privacy Design

| What BSC Stores | What BSC Never Stores |
|---|---|
| SHA-256 hash of Aadhaar | Raw Aadhaar number |
| SHA-256 hash of PAN | Raw PAN number |
| Balance range (₹10L–₹1Cr) | Exact bank balance |
| Property declared value | Private sale negotiations |
| IPFS hash of documents | The documents themselves (stored on IPFS only) |
| Access log (who, when, what purpose) | Content of investigation findings |

**Every access is logged. The citizen always knows who looked at their data.**

---

## Technology Stack

| Layer | Technology | Why |
|---|---|---|
| Blockchain | Hyperledger Fabric 2.5 | Permissioned, government-grade, no gas fees, agency identity management |
| Smart Contracts | Go Chaincode | Best-supported language for Hyperledger, fast execution |
| ZKP | circom + snarkjs | Industry standard, free, no blockchain dependency |
| Backend | Node.js + TypeScript + Express | Best Fabric SDK support, type safety |
| Database | PostgreSQL | Off-chain indexing for fast queries |
| Cache | Redis | Session management, API response cache |
| Document Storage | IPFS | Decentralised, content-addressed, no single point of failure |
| Frontend | React 18 + Vite + TailwindCSS | Component reuse across 4 dashboards, fast builds |
| Charts | Recharts | React-native, no external dependencies |
| Authentication | JWT with role claims | Stateless, scalable, supports ZKP consent tokens |
| Container | Docker + Docker Compose | One-command local setup, reproducible environments |
| CI/CD | GitHub Actions | Free, integrated with repository |

---

## Repository Structure

```
BharatSampadaChain/
│
├── blockchain/                    # Hyperledger Fabric network
│   ├── network/                   # Network configuration, crypto material
│   ├── chaincode/                 # Smart contracts in Go
│   │   ├── anomaly/               # WEALTH_ANOMALY_DETECTOR
│   │   ├── property/              # PROPERTY_TRANSFER_VALIDATOR
│   │   ├── access/                # ACCESS_PERMISSION_ENFORCER
│   │   └── zkp/                   # ZKP_VERIFIER
│   └── scripts/                   # Network setup and teardown scripts
│
├── api/                           # Node.js API gateway
│   ├── src/
│   │   ├── routes/                # All REST endpoints
│   │   ├── middleware/            # Auth, logging, rate limiting
│   │   ├── services/              # Business logic layer
│   │   ├── models/                # TypeScript data models
│   │   └── config/                # Environment configuration
│   └── tests/                     # API tests + Postman collection
│
├── zkp/                           # Zero Knowledge Proof module
│   ├── circuits/                  # circom circuit definitions
│   │   ├── rangeCheck.circom      # "Does net worth exceed X?"
│   │   ├── consistency.circom     # "Is income consistent with assets?"
│   │   ├── ownership.circom       # "Do they own property in state X?"
│   │   └── growth.circom          # "Did wealth grow >X% in Y years?"
│   ├── scripts/                   # Proof generation and verification
│   └── keys/                      # Proving keys (generated, not committed)
│
├── frontend/                      # React applications
│   ├── public-dashboard/          # Politician transparency (no login)
│   ├── citizen-dashboard/         # Citizen portal (Aadhaar login)
│   ├── officer-console/           # IT officer investigation tool
│   ├── admin-panel/               # System administration
│   └── shared/                    # Common components and utilities
│
├── database/
│   ├── schema/                    # PostgreSQL schema definitions
│   ├── migrations/                # Database migration files
│   └── seeds/                     # Realistic dummy data for development
│
├── docker/
│   ├── docker-compose.yml         # Full stack local setup
│   ├── docker-compose.dev.yml     # Development overrides
│   └── docker-compose.prod.yml    # Production configuration
│
├── bsc-prototype/                 # ← START HERE
│   │                              # Standalone frontend prototype
│   │                              # No blockchain, no backend
│   │                              # Runs with npm run dev
│   └── src/
│       ├── data/                  # Realistic dummy JSON data
│       ├── pages/                 # All 15 screens
│       └── components/            # Shared UI components
│
├── docs/
│   ├── api/                       # Auto-generated API reference
│   ├── architecture/              # Architecture decision records
│   └── diagrams/                  # System diagrams (draw.io source)
│
├── .github/
│   └── workflows/                 # CI/CD pipeline definitions
│
├── README.md                      ← You are here
├── WHITEPAPER.md                  # Full concept and technical document
├── ADAPTATION_GUIDE.md            # How to deploy for your jurisdiction
├── SUMMARY.md                     # Open source strategy summary
├── CONTRIBUTING.md                # How to contribute
├── SECURITY.md                    # Vulnerability disclosure process
├── ROADMAP.md                     # Path from prototype to production
└── LICENSE                        # MIT
```

---

## Getting Started

### Option 1 — Run the Prototype (Recommended First Step)

The prototype demonstrates every feature with realistic dummy data. No blockchain, no configuration, no accounts.

**Requirements:** Node.js 18+ and npm

```bash
# Clone the repository
git clone https://github.com/BharatSampadaChain/bsc.git
cd bsc

# Enter the prototype directory
cd bsc-prototype

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open `http://localhost:5173` in your browser.

**You will see a landing page with four role cards. Click any one to enter that role's dashboard.**

Explore in this order for the best demonstration:
1. **Public Observer** → find Chandrakala Devi Yadav → see her ₹67 Cr fortune on ₹8.4L declared income
2. **IT Officer** → open Active Flags → click the RED flag → enter investigation reference → see the gap chart
3. **IT Officer** → click Cross-Family Analysis → see Benami Risk Score: 87/100
4. **Citizen** → view Wealth Overview → go to Data Access Log → see every agency that accessed the data
5. **Admin** → System Health → watch the live transaction counter increment

---

### Option 2 — Run the Full Stack (Blockchain + API + Frontend)

**Requirements:**
- Docker 24+ and Docker Compose v2
- 16 GB RAM minimum (the Hyperledger Fabric network needs ~8 GB)
- 50 GB free disk space
- macOS, Linux, or WSL2 on Windows

```bash
# Clone the repository
git clone https://github.com/BharatSampadaChain/bsc.git
cd bsc

# Copy environment configuration
cp .env.example .env

# Review and edit the configuration (see Configuration section below)
# The defaults work for local development without changes

# Start the entire stack
docker compose up --build
```

**Wait approximately 3–4 minutes for first startup.** Hyperledger Fabric needs to generate crypto material and deploy chaincode on first run.

Once running, access:

| Service | URL |
|---|---|
| Public Dashboard | `http://localhost:3000` |
| Citizen Dashboard | `http://localhost:3001` |
| Officer Console | `http://localhost:3002` |
| Admin Panel | `http://localhost:3003` |
| API Gateway | `http://localhost:4000` |
| API Documentation | `http://localhost:4000/docs` |

To stop the stack:
```bash
docker compose down
```

To stop and remove all data (full reset):
```bash
docker compose down -v
```

---

### Option 3 — Development Setup (Contributing to the Code)

For developers who want to modify the code rather than just run it.

**Requirements:**
- Node.js 18+
- Go 1.21+
- Docker 24+
- PostgreSQL 15+
- Redis 7+

```bash
# Clone and enter
git clone https://github.com/BharatSampadaChain/bsc.git
cd bsc

# Start only the infrastructure (blockchain, database, cache)
docker compose up blockchain postgres redis -d

# Install and start the API gateway
cd api
npm install
npm run dev

# In a new terminal — start any frontend
cd frontend/public-dashboard
npm install
npm run dev
```

Each frontend runs on its own port:

| Frontend | Dev Port | Command |
|---|---|---|
| Public Dashboard | 5173 | `cd frontend/public-dashboard && npm run dev` |
| Citizen Dashboard | 5174 | `cd frontend/citizen-dashboard && npm run dev` |
| Officer Console | 5175 | `cd frontend/officer-console && npm run dev` |
| Admin Panel | 5176 | `cd frontend/admin-panel && npm run dev` |

---

## Configuration

All configuration is through environment variables in `.env`. Copy `.env.example` to `.env` and review every variable before starting.

```bash
cp .env.example .env
```

### Required Variables

```env
# Identity hashing — CRITICAL
# Generate with: openssl rand -hex 32
# Never share this value. Never commit it.
IDENTITY_HASH_SALT=your-cryptographically-random-secret

# JWT signing secret
# Generate with: openssl rand -hex 64
JWT_SECRET=your-jwt-secret

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=bsc
POSTGRES_USER=bsc_admin
POSTGRES_PASSWORD=your-database-password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Hyperledger Fabric
FABRIC_NETWORK_PATH=./blockchain/network
FABRIC_CHANNEL_NAME=bsc-channel
FABRIC_CHAINCODE_NAME=bsc-chaincode
```

### Optional Variables

```env
# IPFS (leave blank to use local IPFS node from Docker)
IPFS_API_URL=https://api.web3.storage
IPFS_TOKEN=your-web3-storage-token

# Email notifications (for citizen access alerts)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=your-smtp-password

# Rate limiting
API_RATE_LIMIT_PER_MINUTE=100
PUBLIC_RATE_LIMIT_PER_MINUTE=10

# Logging
LOG_LEVEL=info  # debug | info | warn | error

# Environment
NODE_ENV=development  # development | production
```

---

## Seeding Development Data

The repository includes a data seeder that populates the database with 50 citizen profiles, 200 property records, 300 financial assets, 30 anomaly flags, and 100 access log entries — all realistic, all fictional.

```bash
cd api
npm run seed
```

This is safe to run multiple times — it checks for existing data and does not duplicate records.

**What the seed data includes:**
- 10 politicians with RED anomaly flags (₹18–67 Cr unexplained wealth)
- 10 politicians with YELLOW/ORANGE flags
- 10 politicians with clear profiles (legitimate wealth)
- 10 public officials with mixed flag status
- 10 HNW citizens with legitimate wealth
- 10 middle-class citizens with modest assets
- 5 suspected benami cases (property distributed across family members)
- 5 shell company cases (multiple business registrations, low declared income)

---

## Running Tests

```bash
# API tests
cd api
npm test

# Smart contract tests
cd blockchain/chaincode
go test ./...

# ZKP circuit tests
cd zkp
node scripts/test-all-circuits.js

# Frontend tests
cd frontend/public-dashboard
npm test
```

### End-to-End Tests

```bash
# Requires the full stack to be running
cd api
npm run test:e2e
```

The E2E test suite covers every success criteria from the PRD:
- A journalist finds a politician's 5-year wealth chart in under 2 minutes
- An IT officer opens and acts on a RED flag case in under 5 minutes
- A citizen views their data access log in under 2 minutes
- A property registration triggers smart contract anomaly detection in under 30 seconds
- A ZKP query returns YES/NO without exposing actual balance

---

## API Reference

The API follows REST conventions. All endpoints:
- Return JSON
- Require JWT authentication (except public endpoints)
- Log every request to the blockchain access log
- Are rate-limited per authenticated user

Interactive documentation is available at `http://localhost:4000/docs` when the API is running.

### Key Endpoint Groups

```
POST   /api/v1/identity/register          Register a new citizen node
GET    /api/v1/identity/:node_id          Get citizen node (filtered by role)

POST   /api/v1/property/register          Register a property (triggers validator)
POST   /api/v1/property/transfer          Transfer ownership (triggers validator)
GET    /api/v1/property/by-citizen/:id    Get citizen's properties

POST   /api/v1/financial/report           Financial institution reports an asset
GET    /api/v1/financial/by-citizen/:id   Get citizen's financial assets

GET    /api/v1/anomaly/flags/active       Get all open flags (officer only)
POST   /api/v1/anomaly/run-check/:id      Trigger smart contract check manually
POST   /api/v1/anomaly/flags/:id/resolve  Resolve a flag (officer only)

GET    /api/v1/public/officials           List all public officials (no auth)
GET    /api/v1/public/officials/:id/timeline  Wealth timeline (no auth)
GET    /api/v1/public/statistics          National aggregate stats (no auth)

POST   /api/v1/zkp/verify                 Submit a ZKP query

GET    /api/v1/audit/logs/by-citizen/:id  Citizen's access log
GET    /api/v1/audit/logs/by-officer/:id  Officer's access history
```

A complete Postman collection is available at `api/tests/postman/BSC.postman_collection.json`.

---

## Deployment

### Local Development

```bash
docker compose up
```

### Staging

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up
```

### Production

Production deployment requires:
- Minimum 3 Hyperledger Fabric peer nodes on separate physical servers
- TLS certificates for all public endpoints
- Properly configured `IDENTITY_HASH_SALT` and `JWT_SECRET` (not the development defaults)
- A backup strategy for the PostgreSQL database
- Monitoring and alerting (Grafana + Prometheus configs provided in `docker/monitoring/`)

See the [Deployment Guide](./docs/deployment.md) for step-by-step production setup instructions.

---

## Adapting BSC for Your Jurisdiction

BSC is designed to be forked and adapted. Whether you are a state government in India, a foreign government, or a civil society organisation — the [ADAPTATION_GUIDE.md](./ADAPTATION_GUIDE.md) tells you exactly:

- What you must change (identity system, currency, property formats, agency list)
- What you should change (language, thresholds, map configuration)
- What you must not change (access logging, no-raw-identifier rule, citizen notification)
- How to calibrate smart contract thresholds for your economic context
- Legal review checklist before going live with real citizen data
- Infrastructure requirements for each deployment mode

---

## Security

### Reporting Vulnerabilities

**Do not report security vulnerabilities through public GitHub issues.**

If you find a security vulnerability in BSC, please disclose it responsibly:

1. Email: `security@bharatsampadachain.org`
2. Use PGP encryption if the vulnerability is sensitive (public key in `SECURITY.md`)
3. Include: description of the vulnerability, steps to reproduce, potential impact
4. We will acknowledge within 48 hours and provide a fix timeline within 7 days

We follow coordinated disclosure — we will not take legal action against good-faith security researchers.

### Security Architecture Summary

- All API communication over TLS 1.3
- Data at rest encrypted with AES-256
- JWT tokens expire in 30 minutes, refresh tokens in 24 hours
- Rate limiting: 100 requests/minute per authenticated user, 10/minute for public endpoints
- No raw Aadhaar or PAN numbers stored anywhere — only SHA-256 hashed and salted values
- Exact financial balances never stored — ranges only
- Every failed authentication attempt logged and alerted after 5 consecutive failures
- Smart contract executions are deterministic and cannot be influenced by the calling party

---

## Contributing

BSC is built for India, by Indians, and contributions are welcome from everyone.

**Before contributing, please read [CONTRIBUTING.md](./CONTRIBUTING.md).**

### Where to Start

The most valuable contributions right now, in priority order:

**1. Security review of smart contract logic**  
If you have experience with Hyperledger Fabric chaincode or blockchain security — review the four smart contracts in `blockchain/chaincode/`. Every vulnerability you find before production is worth more than 1,000 features.

**2. ZKP circuit audit**  
If you know circom and Groth16 — review the circuits in `zkp/circuits/`. Verify that the privacy guarantees are correctly implemented and that there are no edge cases where private data could leak.

**3. Legal research**  
If you are a lawyer or law student — research and document the admissibility of BSC blockchain records under Section 65B of the Indian Evidence Act. This is critical for production deployment and there is no authoritative analysis yet.

**4. Jurisdiction adaptations**  
If you are deploying BSC for a different Indian state or a foreign country — contribute your adaptation work back. See [ADAPTATION_GUIDE.md](./ADAPTATION_GUIDE.md) Section 16.

**5. Frontend accessibility**  
The frontends have not been audited for WCAG 2.1 compliance. If you have accessibility expertise, this is important work.

**6. Hindi and regional language translation**  
The Citizen Dashboard must be accessible in the citizen's first language. Translations of `frontend/citizen-dashboard/src/i18n/en.json` into Hindi and major regional languages are high priority.

### Contribution Process

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/your-username/bsc.git
cd bsc

# Create a branch for your work
git checkout -b feature/your-feature-name

# Make your changes
# Write tests for your changes
# Ensure all existing tests pass

# Submit a pull request with:
# - A clear description of what you changed
# - Why you changed it
# - How to test it
```

**Please do not submit pull requests that:**
- Add features not in the PRD or ROADMAP without discussion first
- Modify smart contract thresholds without a documented methodology
- Bypass any of the security or privacy guarantees listed in "What You Must Not Change" in the ADAPTATION_GUIDE
- Introduce dependencies without justification

---

## Roadmap

| Phase | Timeline | Key Deliverables |
|---|---|---|
| **Phase 0 — Prototype** | Complete | Frontend prototype, dummy data, whitepaper, this README |
| **Phase 1 — Technical Foundation** | Months 1–6 | Hyperledger Fabric testnet, all 4 smart contracts, API gateway, ZKP circuits, full test suite |
| **Phase 2 — State Pilot** | Months 6–18 | Real property data from one state, IT Department integration, security audit, DPDPA legal validation |
| **Phase 3 — Multi-State** | Months 18–36 | 6 states, bank financial asset reporting, public dashboard national launch, ZKP in production |
| **Phase 4 — National** | Years 3–5 | All states and UTs, full financial sector, mobile app, 10+ languages |

Detailed roadmap with milestones, success criteria, and dependencies: [ROADMAP.md](./ROADMAP.md)

---

## Frequently Asked Questions

**Q: Is this affiliated with the Government of India?**  
A: No. BSC is an independent open source project. It is not affiliated with, endorsed by, or funded by any government. It is a proposal and demonstration of what could exist.

**Q: Does this use real citizen data?**  
A: No. The prototype uses entirely fictional dummy data. No real Aadhaar numbers, PAN numbers, property records, or financial data are used anywhere in this repository.

**Q: Does BSC require cryptocurrency or blockchain tokens?**  
A: No. BSC uses Hyperledger Fabric — a permissioned blockchain with no tokens, no gas fees, and no cryptocurrency of any kind.

**Q: Can this be misused for surveillance?**  
A: The architecture includes multiple layers of protection against misuse — access controls enforced by smart contract, immutable access logs, citizen notifications, and a governance model requiring multi-stakeholder oversight. However, no technical system is immune to misuse if the institutions running it are corrupt. Governance integrity requires ongoing civic vigilance. See WHITEPAPER.md Section 17 for a full discussion of limitations.

**Q: Can I use BSC for my country?**  
A: Yes. The MIT license permits use, adaptation, and deployment for any purpose. Read [ADAPTATION_GUIDE.md](./ADAPTATION_GUIDE.md) for jurisdiction-specific guidance.

**Q: What if the government suppresses the official BSC instance?**  
A: Any civil society organisation or institution can run an independent instance using publicly available data (election affidavits, MCA21 records, RTI-sourced data). The MIT license and the open source architecture are specifically designed to make suppression of the concept impossible even if a specific instance is taken offline.

**Q: How is this different from existing government systems like Project Insight?**  
A: Project Insight is a closed, internal system. Citizens cannot see it. Journalists cannot audit it. It is complaint-driven and limited to data the IT Department can legally access. BSC is open source, citizen-visible, journalist-accessible, and designed to connect data across agencies. See WHITEPAPER.md Section 3 for a full comparison.

**Q: I am an IT/Revenue Department official. Can I use this?**  
A: We would very much like to talk to you. Open an issue on GitHub marked `[Government Partnership]` or email us at the address in the contact section.

---

## Who Built This

BSC was conceived and built by independent Indian developers who believe that the data to hold power accountable already exists — it just needs to be connected.

This is not a startup. It is not a company. It is not funded. It is a public good released under MIT license for anyone to use, adapt, and improve.

---

## Acknowledgements

- **Hyperledger Foundation** — for building and maintaining the Fabric framework that makes permissioned blockchain viable for government use cases
- **iden3 team** — for circom and snarkjs, the open source ZKP tools that make privacy-preserving verification accessible to every developer
- **Association for Democratic Reforms (ADR)** — whose years of work analysing election affidavits demonstrated both the value and the limitations of the current system, and the need for something better
- **Every RTI activist in India** — whose work over two decades established the precedent that citizens have a right to know how their institutions are functioning
- **The Indian developer community** — for building the technical foundation (India Stack, UPI, DigiLocker) that makes BSC's vision achievable

---

## License

MIT License — see [LICENSE](./LICENSE) for full text.

You are free to use, copy, modify, merge, publish, distribute, sublicense, and sell copies of this software. You must include the license notice. You have no warranty.

The choice of MIT is intentional. Any government, any democracy, any civil society organisation anywhere in the world can adopt BSC without legal friction. Wealth transparency should not be proprietary.

---

## Contact

- **GitHub Issues** — Bug reports, feature requests, questions about the code
- **GitHub Discussions** — Architecture discussion, adaptation questions, show and tell
- **Email** — `hello@bharatsampadachain.org` — for government partnership inquiries and media

---

<div align="center">

**Bharat Sampada Chain**  
Built by Citizens, For Citizens  

*Every line of code is an argument that cannot be ignored.*

🇮🇳 **Jai Hind**

</div>
