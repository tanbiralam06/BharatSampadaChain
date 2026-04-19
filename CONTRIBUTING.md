# Contributing to Bharat Sampada Chain (BSC)

> First off — thank you. BSC is built on the belief that transparent governance requires transparent code. Every contribution, from a typo fix to a new ZKP circuit, moves that belief forward.

---

## Table of Contents

1. [Before You Start](#1-before-you-start)
2. [Code of Conduct](#2-code-of-conduct)
3. [What We Need Most](#3-what-we-need-most)
4. [What We Do Not Accept](#4-what-we-do-not-accept)
5. [Development Setup](#5-development-setup)
6. [Project Structure](#6-project-structure)
7. [How to Submit a Contribution](#7-how-to-submit-a-contribution)
8. [Pull Request Standards](#8-pull-request-standards)
9. [Commit Message Format](#9-commit-message-format)
10. [Code Style Guide](#10-code-style-guide)
11. [Testing Requirements](#11-testing-requirements)
12. [Security Contributions](#12-security-contributions)
13. [ZKP Circuit Contributions](#13-zkp-circuit-contributions)
14. [Smart Contract (Chaincode) Contributions](#14-smart-contract-chaincode-contributions)
15. [Documentation Contributions](#15-documentation-contributions)
16. [Translation Contributions](#16-translation-contributions)
17. [Review Process](#17-review-process)
18. [Recognition](#18-recognition)

---

## 1. Before You Start

Please read these documents before making your first contribution:

- **[README.md](./README.md)** — what BSC is and how to run it
- **[WHITEPAPER.md](./WHITEPAPER.md)** — the policy and technical rationale behind every design decision
- **[ROADMAP.md](./ROADMAP.md)** — what is currently being built and what is planned

Understanding why BSC makes the choices it does will save you time. Many design decisions that may look like oversights (e.g., no exact wealth amounts on-chain, all access logged, ZKP off-chain) are deliberate and non-negotiable.

---

## 2. Code of Conduct

BSC is a civic project. It will be judged by governments, journalists, academics, and citizens. Hold yourself to a higher standard than a typical open source project.

### Expected Behaviour

- Be respectful and constructive in all communications.
- Assume good intent when reading others' comments.
- Give specific, actionable feedback — not vague criticism.
- Accept that your PR may be rejected. Reasons will be given. It is not personal.
- Keep discussions on-topic. BSC is not a forum for debates about cryptocurrency.

### Unacceptable Behaviour

- Harassment, personal attacks, or discriminatory language.
- Dismissing privacy concerns as unimportant or "over-engineering."
- Proposing features that weaken access controls or audit trails.
- Sharing personal data — even synthetic — that resembles real individuals.
- Attempting to introduce backdoors, weakened cryptography, or data collection not described in the whitepaper.

Violations will result in removal from the project, permanently if warranted.

---

## 3. What We Need Most

These are the areas where outside help will have the greatest impact, ranked by urgency:

### Priority 1 — Security Review

BSC will eventually handle data about real people and be read by law enforcement. Security flaws are not bugs — they are harms.

- Review smart contracts for logic errors in anomaly detection rules
- Review the API for authentication and authorisation bypasses
- Review the ZKP circuits for soundness issues (false proofs, witness leakage)
- Review data flows for points where raw personal data could be inadvertently stored

**If you find a security issue, do not open a public GitHub issue. Read [SECURITY.md](./SECURITY.md).**

### Priority 2 — ZKP Circuit Audit

The four circom circuits are the most technically demanding part of BSC. We need contributors who understand:

- R1CS constraint systems
- Groth16 soundness assumptions
- Common circuit bugs (unconstrained witnesses, overflow, division-by-zero workarounds)

If you are a ZKP researcher or have worked with circom before, your review is the highest-value contribution you can make.

### Priority 3 — Smart Contract (Go Chaincode) Development

Phase 1 requires four Hyperledger Fabric chaincode contracts written in Go. If you know Go and understand basic ledger concepts, you can contribute here without needing any blockchain expertise specific to Ethereum or Polygon — Hyperledger Fabric is entirely different.

### Priority 4 — Legal Research

BSC operates at the intersection of several Indian laws:

- Digital Personal Data Protection Act, 2023 (DPDPA)
- Prevention of Money Laundering Act, 2002 (PMLA)
- Right to Information Act, 2005 (RTI)
- Section 65B of the Indian Evidence Act (admissibility)

If you are a lawyer, legal researcher, or law student, a review of our compliance approach in the whitepaper — and a contribution to `docs/legal/` — would be enormously valuable.

### Priority 5 — Translations

The whitepaper and public dashboard must reach citizens who do not read English. Translations into Hindi, Tamil, Telugu, Bengali, and Kannada are needed.

### Priority 6 — Documentation and Diagrams

Clear architecture diagrams, sequence diagrams (ZKP proof flow, officer investigation flow), and deployment guides help institutions evaluate BSC without reading the source code.

---

## 4. What We Do Not Accept

To protect BSC's integrity, we will not merge PRs that:

- Weaken or remove any access logging (every query must remain auditable)
- Remove citizen notifications on officer access
- Store raw Aadhaar numbers, PAN numbers, or biometric data anywhere in the system
- Add cryptocurrency, tokens, gas fees, or any Web3 financial mechanism
- Replace Hyperledger Fabric with a public blockchain (Ethereum, Polygon, Solana, etc.)
- Add external API dependencies without a free, self-hostable alternative
- Introduce features not described in the PRD or roadmap without first opening a discussion
- Change the MIT licence to anything more restrictive

If you want to propose a significant change to BSC's architecture or philosophy, open a GitHub Discussion first. Do not spend two weeks building something before checking if it fits the project's direction.

---

## 5. Development Setup

### Requirements

- **Docker Desktop** (or Docker Engine + Docker Compose plugin) — v24+
- **Node.js** — v20 LTS
- **Go** — v1.22+ (for chaincode development)
- **Git** — v2.40+

Optional but recommended:
- **circom** — v2.1.8+ (for ZKP circuit development)
- **snarkjs** — v0.7+ (install globally: `npm install -g snarkjs`)

### First-Time Setup

```bash
# 1. Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/BharatSampadaChain.git
cd BharatSampadaChain

# 2. Add the upstream remote
git remote add upstream https://github.com/BharatSampadaChain/BharatSampadaChain.git

# 3. Run the prototype (no Docker needed for this)
cd bsc-prototype
npm install
npm run dev
# Open http://localhost:5173

# 4. Start the full stack (requires Docker)
cd ..
make setup   # First-time: creates Fabric network, deploys chaincode
make seed    # Seeds PostgreSQL with test data
docker compose up
# API: http://localhost:3001
# Frontend: http://localhost:5173
# Fabric Explorer: http://localhost:8080
```

### Working on a Specific Component

```bash
# API only
cd api && npm install && npm run dev

# Chaincode only (Go)
cd blockchain/chaincode/wealth-anomaly-detector
go test ./...

# ZKP circuits only
cd zkp
npm install
node scripts/compile.js      # Compile circuits
node scripts/prove.js        # Generate test proof
node scripts/verify.js       # Verify the proof
```

---

## 6. Project Structure

```
BharatSampadaChain/
├── blockchain/
│   ├── network/             — Fabric network config (crypto, channel, orderer)
│   └── chaincode/
│       ├── wealth-anomaly-detector/   — Go
│       ├── property-transfer-validator/   — Go
│       ├── access-permission-enforcer/    — Go
│       └── zkp-verifier/                 — Go
├── api/                     — Node.js + TypeScript + Express
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── fabric/          — Fabric SDK integration
│   └── tests/
├── zkp/                     — circom circuits + snarkjs scripts
│   ├── circuits/
│   │   ├── net_worth_range.circom
│   │   ├── income_consistency.circom
│   │   ├── state_membership.circom
│   │   └── growth_rate.circom
│   ├── scripts/
│   └── tests/
├── frontend/                — React + Vite + TailwindCSS
│   └── src/
│       ├── pages/
│       │   ├── public/
│       │   ├── citizen/
│       │   ├── officer/
│       │   └── admin/
│       ├── components/
│       ├── context/
│       └── data/
├── database/
│   ├── schema/              — PostgreSQL DDL
│   └── migrations/          — Flyway migration files
├── seed/                    — Data generator scripts
├── docs/
│   ├── api.yaml             — OpenAPI specification
│   ├── architecture/        — Diagrams
│   └── legal/               — Compliance notes
├── docker/
│   └── docker-compose.yml
├── .github/
│   ├── workflows/           — CI/CD
│   └── ISSUE_TEMPLATE/
├── bsc-prototype/           — Standalone React demo (dummy data only)
├── WHITEPAPER.md
├── ROADMAP.md
├── CONTRIBUTING.md          ← you are here
├── SECURITY.md
└── LICENSE
```

---

## 7. How to Submit a Contribution

### Step 1 — Check existing issues

Search open issues and pull requests before starting. Someone may already be working on the same thing.

### Step 2 — Open an issue first (for non-trivial changes)

For anything beyond a typo fix or small bug, open an issue first and describe:

- What you want to change and why
- What approach you plan to take
- Any trade-offs or alternatives you considered

Wait for a maintainer response before investing significant time. This protects you from building something that won't be merged.

### Step 3 — Create a branch

```bash
# Sync with upstream first
git fetch upstream
git checkout main
git merge upstream/main

# Create a branch with a descriptive name
git checkout -b feat/zkp-range-proof-circuit
git checkout -b fix/access-log-missing-officer-id
git checkout -b docs/add-deployment-guide
git checkout -b chore/update-fabric-version
```

Branch naming convention:
- `feat/` — new feature
- `fix/` — bug fix
- `docs/` — documentation only
- `test/` — tests only
- `chore/` — maintenance (dependency updates, config changes)
- `refactor/` — code restructure, no behaviour change
- `security/` — security fix (for non-sensitive issues; see SECURITY.md for vulnerabilities)

### Step 4 — Make your changes

Write code. Write tests. Write or update documentation.

### Step 5 — Test locally

```bash
# Run all tests
make test

# Run tests for a specific component
cd api && npm test
cd blockchain/chaincode/wealth-anomaly-detector && go test ./...
cd zkp && node tests/run.js
```

All tests must pass before you submit.

### Step 6 — Open a Pull Request

Push your branch and open a PR against `main`.

```bash
git push origin feat/your-branch-name
```

Then open a PR on GitHub. Use the PR template (it will appear automatically).

---

## 8. Pull Request Standards

Every PR must:

- **Have a clear title** that describes what it does, not how (`Add ZKP range proof circuit`, not `Update circom files`)
- **Reference an issue** — `Closes #123` or `Relates to #456`
- **Include a description** — what changed, why, and any decisions made
- **Pass all CI checks** — tests, linting, build
- **Not exceed 400 lines of diff** — for large features, break into sequential PRs

### PR Description Template

```markdown
## What

One paragraph describing what this PR changes.

## Why

Why is this change needed? Reference the issue.

## How

Brief description of the approach taken.

## Testing

What tests were added or modified? How was this tested manually?

## Checklist

- [ ] Tests added for new functionality
- [ ] Existing tests still pass
- [ ] Documentation updated (if applicable)
- [ ] No raw Aadhaar/PAN data introduced
- [ ] No new dependencies without free, self-hostable alternative
- [ ] Access logging not weakened
```

---

## 9. Commit Message Format

BSC uses [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `test`, `chore`, `refactor`, `security`, `perf`

**Scopes:** `api`, `chaincode`, `zkp`, `frontend`, `database`, `docker`, `docs`, `ci`

**Examples:**

```
feat(chaincode): add wealth surge detection rule to WealthAnomalyDetector

fix(api): correct role guard to block CITIZEN from officer endpoints

docs(zkp): add circuit design rationale to zkp/README.md

test(chaincode): add unit tests for benami suspicion threshold edge cases

security(api): sanitise query parameters to prevent log injection

chore(ci): update Node.js GitHub Actions runner to v20
```

**Rules:**

- Use present tense: "add" not "added", "fix" not "fixed"
- Keep the subject line under 72 characters
- Separate subject from body with a blank line
- Reference issues in the footer: `Closes #123`

---

## 10. Code Style Guide

### TypeScript / JavaScript (API, Frontend)

- **Formatter:** Prettier (config in `.prettierrc`)
- **Linter:** ESLint (config in `.eslintrc`)
- **Style:** 2-space indent, single quotes, semicolons
- Run `npm run lint` and `npm run format` before committing
- No `any` types in TypeScript without a comment explaining why
- No `console.log` in production code — use the Winston logger

### Go (Chaincode)

- **Formatter:** `gofmt` — run before committing (`gofmt -w .`)
- **Linter:** `golangci-lint`
- Follow standard Go idioms — error handling, no global state, exported names for exported functions
- All exported functions must have a Go doc comment

### circom (ZKP Circuits)

- One circuit per file, file name matches the circuit name
- Comment every signal: what it represents, its range, and why it is constrained
- Add a test vector at the top of the file as a comment (input → expected output)
- No magic numbers — use named `var` declarations for all constants

### CSS / Tailwind

- Prefer Tailwind utility classes over custom CSS
- Custom CSS only in `index.css` under `@layer components`
- No inline styles

---

## 11. Testing Requirements

| Component | Test Framework | Coverage Target |
|---|---|---|
| API (TypeScript) | Jest + Supertest | 80% |
| Chaincode (Go) | Go testing package | 90% |
| ZKP Circuits | snarkjs + custom runner | 100% of circuits |
| Frontend | Vitest + Testing Library | 60% |

### Chaincode Testing Requirements

Every anomaly detection rule must have tests for:
- Normal case (no flag triggered)
- Exactly at threshold (boundary condition)
- Clearly above threshold (flag triggered)
- Adversarial input (negative numbers, zero, overflow values)

### ZKP Circuit Testing Requirements

Every circuit must have tests for:
- Valid witness — proof generates and verifies correctly
- Invalid witness — proof generation fails
- Edge case — values exactly at circuit boundaries
- Soundness check — verify no false proofs are possible with adversarial input

---

## 12. Security Contributions

**Do not open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability, follow the responsible disclosure process in [SECURITY.md](./SECURITY.md).

In summary:
1. Email the maintainer directly with `[BSC SECURITY]` in the subject line
2. Include a description, reproduction steps, and impact assessment
3. Allow 90 days for a fix before public disclosure
4. You will be credited in the security advisory (unless you request anonymity)

Security fixes that are submitted as public PRs without prior disclosure will be closed and the submitter asked to resubmit through the proper channel. This protects users who may not be able to patch immediately.

---

## 13. ZKP Circuit Contributions

ZKP circuits are the most sensitive part of BSC. A bug in a ZKP circuit can produce false proofs — the system would report "YES, wealth is below threshold" when it should report "NO." In a law enforcement context, this is not a software bug. It is a miscarriage of justice.

### Before Writing a Circuit

1. Read the [circom documentation](https://docs.circom.io/) fully.
2. Read the existing circuits and understand the constraint style.
3. Open an issue describing your circuit design **before** writing any code. The maintainer will review the design at this stage.

### Circuit Review Checklist

Every circuit PR is reviewed against:

- [ ] Every signal is constrained — no unconstrained witnesses
- [ ] No division by zero is possible in any input combination
- [ ] Integer overflow is handled (BSC works in paise, not rupees — numbers are large)
- [ ] The circuit cannot be satisfied by an invalid witness
- [ ] A complete test vector is included
- [ ] A human-readable description of what the circuit proves is in the file header
- [ ] The Groth16 trusted setup procedure is documented

### Reusing the Powers of Tau Ceremony

Do not run a new trusted setup ceremony. BSC reuses the publicly available Perpetual Powers of Tau ceremony. See `zkp/README.md` for the exact ceremony transcript hash to use.

---

## 14. Smart Contract (Chaincode) Contributions

Hyperledger Fabric chaincode runs in a sandboxed Docker container and is written in Go. It does not behave like Solidity smart contracts — there is no gas limit, no public mempool, and state is managed by CouchDB (not a Merkle tree directly visible to the developer).

### Key Rules for Chaincode

- All state changes must emit a Fabric event — the API subscribes to these events
- Every chaincode function must be idempotent — calling it twice with the same input must produce the same result
- Use `ctx.GetStub().GetTxTimestamp()` for all time values — never `time.Now()`
- Never store raw personal identifiers — store only SHA-256 hashes
- All reads/writes must go through the defined key schema in `keys.go`

### Threshold Configuration

Anomaly detection thresholds (e.g., "flag wealth surges > 300% in 3 years") must be:
- Stored in the ledger state, not hardcoded
- Updateable only via the governance chaincode (Phase 4)
- Logged as a state change with timestamp and caller identity

Do not hardcode thresholds into chaincode logic. They belong in the config state.

---

## 15. Documentation Contributions

Good documentation is as important as good code. Decision-makers at NIC, UIDAI, and state governments evaluate BSC primarily through its documentation.

### What Good Documentation Looks Like

- **Precise.** Use exact numbers, not approximate descriptions.
- **Verifiable.** Claims about the system should reference specific files or functions.
- **Accessible.** The whitepaper and public documentation should be readable by a policy analyst, not just a developer.
- **Honest.** Document limitations clearly. BSC is not magic. Describe what it cannot do.

### Documentation Standards

- Use British English for all formal documents (whitepaper, adaptation guide)
- Use American English for code comments and API documentation (consistent with the toolchain)
- Tables are preferred over bullet lists for comparisons
- Every architecture diagram must have a text description for accessibility
- Diagrams use Mermaid or ASCII — no binary image files for diagrams (they cannot be reviewed in a diff)

---

## 16. Translation Contributions

BSC documentation must reach citizens who do not read English. The priority languages are:

| Language | Script | Priority | Status |
|---|---|---|---|
| Hindi | Devanagari | P0 | Not started |
| Tamil | Tamil script | P0 | Not started |
| Telugu | Telugu script | P1 | Not started |
| Bengali | Bengali script | P1 | Not started |
| Kannada | Kannada script | P1 | Not started |
| Marathi | Devanagari | P2 | Not started |
| Gujarati | Gujarati script | P2 | Not started |

### What to Translate

Start with the Public Dashboard UI strings and the citizen-facing sections of the whitepaper. Full technical documentation translation is a lower priority than making the citizen portal accessible.

### Translation Process

1. Create `docs/translations/<language-code>/` (e.g., `docs/translations/hi/`)
2. Translate one document at a time, starting with `PUBLIC_EXPLAINER.md`
3. Open a PR with the translation
4. A native speaker from the community will review before merge
5. Translations are versioned — if the source document changes significantly, the translation is marked "outdated" until updated

---

## 17. Review Process

### Who Reviews PRs

- **Maintainer (core review):** All PRs — architecture, security, compliance
- **ZKP reviewer:** All circuit and ZKP-related changes
- **Go reviewer:** All chaincode changes
- **Community reviewers:** Documentation, frontend, tests

### Review Timelines

| PR Type | First Response | Final Decision |
|---|---|---|
| Bug fix (small) | 48 hours | 1 week |
| New feature (with issue) | 1 week | 3 weeks |
| Security fix | 24 hours | 48 hours |
| Documentation | 48 hours | 1 week |
| New ZKP circuit | 1 week | 4–6 weeks |
| New chaincode contract | 1 week | 3–4 weeks |

These are targets, not guarantees. BSC is maintained by individuals with other responsibilities.

### What Happens After Review

- **Approved:** Your PR is merged. Thank you.
- **Changes requested:** Address the feedback and push new commits. Do not close and reopen the PR.
- **Rejected:** You will receive a detailed explanation. You may appeal by opening a Discussion.

---

## 18. Recognition

Contributors to BSC are credited in:

- The `CONTRIBUTORS.md` file (maintained automatically via `git log`)
- The whitepaper acknowledgements section (significant contributions)
- GitHub release notes (for contributions that ship in a release)
- Security advisories (for responsible disclosure — unless anonymity requested)

The most meaningful recognition, however, is this: if BSC is adopted by any government institution, every contributor's work will become part of a real transparency system affecting real citizens. That is rarer than any open source badge.

---

## Questions?

- **General questions:** Open a GitHub Discussion
- **Bugs:** Open a GitHub Issue with the `bug` label
- **Security issues:** See [SECURITY.md](./SECURITY.md) — do not open a public issue
- **Partnership or institutional enquiries:** Email the maintainer

---

*Bharat Sampada Chain — Built by Citizens, For Citizens. Jai Hind.*
