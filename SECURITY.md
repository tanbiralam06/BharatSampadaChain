# Security Policy — Bharat Sampada Chain (BSC)

> BSC is designed to handle data about real people and to be used by law enforcement agencies. A security flaw is not a software bug — it is a potential harm to real citizens. This policy reflects that seriousness.

---

## Table of Contents

1. [Supported Versions](#1-supported-versions)
2. [How to Report a Vulnerability](#2-how-to-report-a-vulnerability)
3. [What to Include in Your Report](#3-what-to-include-in-your-report)
4. [What Happens After You Report](#4-what-happens-after-you-report)
5. [Severity Classification](#5-severity-classification)
6. [Scope — In-Scope Targets](#6-scope--in-scope-targets)
7. [Scope — Out of Scope](#7-scope--out-of-scope)
8. [Known Limitations (Not Vulnerabilities)](#8-known-limitations-not-vulnerabilities)
9. [Security Design Principles](#9-security-design-principles)
10. [Cryptographic Standards](#10-cryptographic-standards)
11. [Data Protection Guarantees](#11-data-protection-guarantees)
12. [Threat Model](#12-threat-model)
13. [Security Hall of Fame](#13-security-hall-of-fame)

---

## 1. Supported Versions

Security fixes are provided for:

| Version | Supported |
|---|---|
| `main` branch (latest) | ✅ Yes |
| Released tagged versions (latest) | ✅ Yes |
| Released tagged versions (previous minor) | ✅ Yes — critical fixes only |
| Older versions | ❌ No — please upgrade |

The prototype (`bsc-prototype/`) is a demonstration tool, not a production system. While we appreciate bug reports, it does not handle real data and is not in scope for critical security advisories.

---

## 2. How to Report a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

A public issue reveals the vulnerability to everyone — including people who would exploit it — before any fix is available. That puts every deployment of BSC at risk.

### Step 1 — Send an email

Email the maintainer directly:

```
To: alamtanbir328@gmail.com
Subject: [BSC SECURITY] <brief description>
```

Encrypt your email using PGP if the details are highly sensitive. The public key is available at the bottom of this document.

### Step 2 — Use GitHub Private Vulnerability Reporting (alternative)

GitHub supports private security advisories. You can report at:

```
https://github.com/BharatSampadaChain/BharatSampadaChain/security/advisories/new
```

This keeps the report private and starts a tracked disclosure process.

### Step 3 — Do not disclose publicly until coordinated

Please allow 90 days for a fix before disclosing the vulnerability publicly. If 90 days pass without a fix or response, you are free to disclose at your discretion.

---

## 3. What to Include in Your Report

A good vulnerability report allows us to reproduce and verify the issue without going back and forth.

Please include:

```
1. SUMMARY
   One paragraph describing what the vulnerability is and what an attacker can do with it.

2. COMPONENT AFFECTED
   Which part of BSC is affected?
   [ ] API (Node.js / Express)
   [ ] Smart Contract (Hyperledger Fabric Chaincode)
   [ ] ZKP Circuits (circom)
   [ ] Frontend (React)
   [ ] Database (PostgreSQL)
   [ ] Fabric Network Configuration
   [ ] Docker / Infrastructure
   [ ] Documentation (incorrect security guidance)

3. SEVERITY (your assessment)
   [ ] Critical — remote code execution, data breach of citizen records, false ZKP proof
   [ ] High — authentication bypass, privilege escalation, access log tampering
   [ ] Medium — information disclosure, CSRF, insecure direct object reference
   [ ] Low — minor information leakage, hardcoded non-sensitive credentials

4. STEPS TO REPRODUCE
   Step-by-step instructions to reproduce the vulnerability.
   Include: environment, request/response examples, code snippets.

5. PROOF OF CONCEPT (if available)
   A minimal proof-of-concept demonstrating the vulnerability.
   Do not include weaponised exploits.

6. IMPACT
   Who is affected? What data is at risk? What actions can an attacker take?

7. SUGGESTED FIX (optional)
   If you have a fix in mind, describe it. You may submit a fix as part of the disclosure.

8. YOUR DETAILS
   Name and how you would like to be credited (or state if you wish to remain anonymous).
```

---

## 4. What Happens After You Report

| Timeline | Action |
|---|---|
| Within 24 hours | Acknowledgement email from the maintainer confirming receipt |
| Within 72 hours | Initial severity assessment shared with the reporter |
| Within 14 days | Fix developed (for Critical/High severity) |
| Within 30 days | Fix merged, tested, and a patched release published |
| Within 90 days | Public security advisory published (CVE requested if applicable) |
| After resolution | Reporter credited in the advisory (unless anonymity requested) |

For **Critical** severity issues (remote code execution, citizen data breach, false ZKP proof), response will be within 24 hours and a patch will be prioritised above all other work.

If you do not receive an acknowledgement within 48 hours, please follow up by opening a private advisory on GitHub.

---

## 5. Severity Classification

BSC uses a modified CVSS-style severity framework that accounts for the civic sensitivity of the system.

### Critical

Any vulnerability that:

- Allows an attacker to generate a false ZKP proof (soundness failure)
- Allows an attacker to read raw Aadhaar numbers, PAN numbers, or biometric data
- Allows remote code execution on a BSC node
- Allows access logs to be deleted or tampered with
- Allows a non-officer user to access flagged citizen profiles
- Allows a citizen's financial data to be accessed without triggering a notification

**Response time: 24 hours. Patch target: 14 days.**

### High

Any vulnerability that:

- Allows privilege escalation (e.g., PUBLIC user accessing OFFICER endpoints)
- Allows authentication bypass
- Allows an attacker to suppress or modify citizen notifications
- Allows SQL injection against the PostgreSQL database
- Allows smart contract state to be read without authorisation
- Exposes investigation reference numbers to unauthorised parties

**Response time: 48 hours. Patch target: 21 days.**

### Medium

Any vulnerability that:

- Leaks system version, stack, or configuration details
- Allows CSRF attacks on state-changing endpoints
- Allows an attacker to enumerate citizen node IDs without authorisation
- Allows rate limiting to be trivially bypassed
- Produces verbose error messages exposing internal architecture

**Response time: 1 week. Patch target: 45 days.**

### Low

Any vulnerability that:

- Exposes non-sensitive metadata
- Presents minor UI inconsistencies that could mislead users
- Involves hardcoded non-sensitive test credentials
- Involves missing security headers (HSTS, CSP) in the demo deployment

**Response time: 2 weeks. Patch target: 90 days.**

---

## 6. Scope — In-Scope Targets

The following are in scope for security research:

| Target | Description |
|---|---|
| `api/` | REST API — authentication, authorisation, data handling |
| `blockchain/chaincode/` | All four Hyperledger Fabric smart contracts |
| `zkp/circuits/` | All circom ZKP circuits |
| `frontend/` | React frontend — XSS, CSRF, insecure data handling |
| `database/` | PostgreSQL schema — injection, privilege escalation |
| `docker/docker-compose.yml` | Container configuration — privilege, network exposure |
| `blockchain/network/` | Fabric network configuration — TLS, MSP, channel policy |
| All documented API endpoints | As described in `docs/api.yaml` |

You may test against a locally running instance of BSC. Do not test against any shared or deployed instance without explicit written permission.

---

## 7. Scope — Out of Scope

The following are **not** in scope:

- The `bsc-prototype/` demo (uses dummy data, not a production system)
- Social engineering or phishing attacks
- Denial of service attacks against shared infrastructure
- Vulnerabilities in third-party dependencies that are not triggered by BSC's usage pattern
- Attacks requiring physical access to the server
- Theoretical attacks without a working proof of concept
- Issues in browsers or operating systems (not BSC's responsibility)
- Reports generated by automated scanners without manual validation

Reports for out-of-scope items will be noted but will not result in credit or advisory status.

---

## 8. Known Limitations (Not Vulnerabilities)

The following are known limitations of BSC that are accepted design trade-offs, not security vulnerabilities:

### Prototype Uses Dummy Data

`bsc-prototype/` contains no real citizen data and no real blockchain. All data is static JSON. Do not report the absence of real cryptography in the prototype.

### ZKP Trusted Setup

BSC reuses the public Perpetual Powers of Tau ceremony for Groth16 proofs. This means the system's soundness relies on the assumption that at least one participant in that ceremony honestly destroyed their randomness. This is a known and accepted assumption for the current phase. We are aware of PLONK-based universal setups that eliminate this assumption — they are on the long-term roadmap.

### Access Log is Append-Only, Not Tamper-Proof in Phase 1

In Phase 1, access logs are stored in Hyperledger Fabric's ledger, which is append-only by design. However, a compromised orderer node could theoretically censor future log writes. Full tamper-proof guarantees require multi-orderer consensus (Phase 4). Do not report the Phase 1 single-orderer configuration as a vulnerability — it is documented.

### No End-to-End Encryption for API Responses

BSC relies on TLS for transit encryption. API responses are decrypted at the TLS termination point. In Phase 4, we will evaluate response-level encryption for the most sensitive endpoints. Do not report the absence of application-layer encryption as a critical vulnerability.

### Balance Ranges, Not Exact Amounts

Storing wealth ranges (e.g., ₹1Cr–5Cr) instead of exact amounts is a privacy feature, not a security gap. Do not report the absence of exact figures as a data integrity issue.

---

## 9. Security Design Principles

Understanding BSC's security model helps distinguish genuine vulnerabilities from intentional design.

### Principle 1: No Raw Personal Identifiers On-Chain

Aadhaar numbers, PAN numbers, and biometric data are never stored on the blockchain ledger or in the off-chain database in raw form. All identifiers are SHA-256 hashed before storage. The original identifier is held only by the submitting agency and is never transmitted to BSC.

### Principle 2: Zero-Knowledge for Sensitive Queries

Financial queries that could reveal exact wealth figures must be answered via ZKP proofs. An officer asking "Does this person's net worth exceed ₹1 Crore?" receives a cryptographic YES/NO — not the actual net worth figure. The actual figure is never transmitted.

### Principle 3: Every Access Is Audited

Every query against a citizen profile is recorded on the Fabric ledger. This includes:
- Who queried (officer ID)
- When (Fabric transaction timestamp)
- What was queried (citizen node ID, query type)
- The investigation reference number

This log is append-only. It cannot be deleted — not by officers, not by administrators. This is by design.

### Principle 4: Citizens Know When They Are Queried

When an IT officer queries a citizen's profile, the citizen receives a notification containing:
- The date and time of the query
- The investigating agency (not the officer's name)
- The investigation reference number
- A link to contest the query

This notification is mandatory. It cannot be suppressed by configuration.

### Principle 5: Data Minimization

BSC stores only what is necessary to answer the anomaly detection queries. It does not store:
- Raw transaction histories
- Bank statements
- Biometric data
- Communications data

Any contribution that introduces additional data collection must be justified against this principle.

### Principle 6: Role Separation is Enforced On-Chain

Role-based access control is enforced at two levels: the API middleware (first check) and the Fabric smart contract (second check). A compromised API cannot grant access that the smart contract does not allow. The smart contract is the authoritative access policy.

---

## 10. Cryptographic Standards

BSC uses the following cryptographic primitives. Contributions that propose weaker alternatives will be rejected.

| Use Case | Algorithm | Standard |
|---|---|---|
| Blockchain identity (MSP) | ECDSA P-256 | Hyperledger Fabric default |
| TLS transport | TLS 1.3 | NIST SP 800-52 Rev 2 |
| Data hashing (PII) | SHA-256 | FIPS 180-4 |
| ZKP proving system | Groth16 | [GROTH16] — Eurocrypt 2016 |
| ZKP circuit language | circom 2.x | — |
| JWT signing | RS256 (RSA + SHA-256) | RFC 7518 |
| Password hashing (admin) | Argon2id | OWASP recommendation |
| Database encryption at rest | AES-256-GCM | FIPS 197 |

**Do not propose:**
- MD5 or SHA-1 for any purpose
- RSA-1024 or smaller key sizes
- DES or 3DES
- Custom cryptographic implementations
- Any ZKP system without a published security proof

---

## 11. Data Protection Guarantees

BSC makes the following guarantees about citizen data. These are not aspirational — they are verifiable by reading the code:

| Guarantee | Where Enforced |
|---|---|
| Raw Aadhaar/PAN never stored | API middleware + chaincode input validation |
| Exact balance amounts never on-chain | Chaincode write validation |
| Every officer access logged on-chain | `AccessPermissionEnforcer` chaincode |
| Citizen notified on every officer query | `AccessPermissionEnforcer` chaincode event |
| ZKP proofs contain no raw data | circom circuit design |
| Access logs cannot be deleted | Fabric ledger append-only property |
| Public dashboard shows only aggregated data | React component + API response shape |

Any contribution that weakens these guarantees — even with good intentions — will be rejected.

---

## 12. Threat Model

Understanding who the adversaries are helps prioritise what to protect.

### Adversary 1 — Corrupt Officer

**Goal:** Access a citizen's financial profile without leaving a trace, or suppress a notification to avoid the citizen knowing they were investigated.

**Mitigations:**
- All access logged on-chain (append-only — cannot be deleted)
- Citizen notification mandatory and on-chain
- Officer cannot access without valid investigation reference number
- ZKP means officer sees YES/NO, not raw figures

**Residual risk:** Compromised Fabric orderer could censor future log writes. Mitigated in Phase 4 with multi-orderer consensus.

### Adversary 2 — Corrupt Administrator

**Goal:** Modify anomaly detection thresholds to protect a specific individual, delete their flag, or grant unauthorised access.

**Mitigations:**
- Threshold changes require governance chaincode (Phase 4) — multi-party approval
- Flag deletions are recorded as state transitions, not erasures — history preserved
- Admin actions logged like officer actions

**Residual risk:** In Phase 1, admin has elevated on-chain write access. Full governance separation is Phase 4.

### Adversary 3 — External Attacker

**Goal:** Exfiltrate citizen financial data or inject false anomaly flags.

**Mitigations:**
- No raw PII stored — even successful exfiltration yields only SHA-256 hashes
- Fabric network requires valid MSP certificate to write to ledger
- API requires valid JWT for any non-public endpoint
- Rate limiting on all endpoints

**Residual risk:** API key compromise. Mitigated by short-lived JWTs and HSM key storage in Phase 4.

### Adversary 4 — Politically Motivated Developer

**Goal:** Introduce a backdoor or a subtle weakening of the ZKP circuits that allows false proofs for specific inputs.

**Mitigations:**
- All code is public and reviewed before merge
- ZKP circuits reviewed by cryptography-aware reviewers
- Formal verification planned for Phase 4
- MIT licence means any institution can independently audit before deployment

**Residual risk:** Subtle circuit bugs are hard to catch in review. Full formal verification is the only complete mitigation.

### Out of Scope for This Threat Model

- Nation-state attacks against Fabric peer infrastructure
- Hardware-level attacks on citizen devices
- Attacks against the government agencies providing source data

---

## 13. Security Hall of Fame

Responsible disclosure of a genuine security vulnerability will result in public credit here and in the GitHub security advisory.

*No advisories have been published yet. BSC is pre-production.*

When the project reaches Phase 1 (real blockchain integration), a formal bug bounty programme will be considered. For now, recognition is the reward — and the knowledge that you helped protect a system designed to protect citizens.

---

## PGP Public Key

For encrypted communications:

```
-----BEGIN PGP PUBLIC KEY BLOCK-----
[PGP public key will be added here before Phase 1 launch]
-----END PGP PUBLIC KEY BLOCK-----
```

---

*Bharat Sampada Chain — Built by Citizens, For Citizens. Jai Hind.*
