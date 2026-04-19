# BSC Adaptation Guide
## How to Deploy Bharat Sampada Chain for Your Jurisdiction

**Version:** 1.0  
**Date:** April 2024  
**Applies To:** State Governments (India), Foreign Governments, Civil Society Organisations, Independent Researchers  
**Prerequisite:** Read [WHITEPAPER.md](./WHITEPAPER.md) before this document.

---

> This guide is for anyone who wants to deploy BSC for their own state, country, or organisation.  
> It tells you exactly what to change, what to keep, and what decisions you need to make before going live.

---

## Table of Contents

1. [Before You Begin — Four Questions](#1-before-you-begin--four-questions)
2. [Deployment Modes — Pick One](#2-deployment-modes--pick-one)
3. [What You Must Change](#3-what-you-must-change)
4. [What You Should Change](#4-what-you-should-change)
5. [What You Must Not Change](#5-what-you-must-not-change)
6. [Adapting for Indian State Governments](#6-adapting-for-indian-state-governments)
7. [Adapting for Foreign Governments](#7-adapting-for-foreign-governments)
8. [Adapting for Civil Society Organisations](#8-adapting-for-civil-society-organisations)
9. [National Identity System Mapping](#9-national-identity-system-mapping)
10. [Land Registry Format Mapping](#10-land-registry-format-mapping)
11. [Smart Contract Threshold Calibration](#11-smart-contract-threshold-calibration)
12. [Legal Review Checklist](#12-legal-review-checklist)
13. [Data Privacy Compliance by Jurisdiction](#13-data-privacy-compliance-by-jurisdiction)
14. [Infrastructure Requirements](#14-infrastructure-requirements)
15. [Going Live — Checklist](#15-going-live--checklist)
16. [Getting Help](#16-getting-help)

---

## 1. Before You Begin — Four Questions

Answer these four questions before writing a single line of code. Your answers determine everything else in this guide.

---

**Question 1: What data do you have access to?**

BSC connects data. If you do not have access to at least one of the following, BSC cannot generate meaningful anomaly flags:

| Data Source | What BSC Does With It | Can BSC Work Without It? |
|---|---|---|
| Property registration records | Builds the PropertyRecord for each citizen node | No — this is the core data |
| Income declaration records (ITR equivalent) | Runs the WEALTH_ANOMALY_DETECTOR rules | Severely limited without it |
| Financial asset data from banks | Builds the FinancialAsset records | Optional — system works but with less coverage |
| National identity system | Creates the CitizenNode identity link | No — required for the identity layer |
| Business ownership records | Runs Shell Company detection | Optional |

If you only have property registration data and a national identity system, you can still run BSC in a limited mode that tracks property ownership and chain of title — without the income comparison rules. This is still valuable.

---

**Question 2: What is your legal authority to connect this data?**

BSC connecting datasets across agencies is a significant legal act. Before deployment:

- Do you have statutory authority to access each data source you plan to connect?
- Does your jurisdiction have a data protection law, and does BSC's architecture comply with it?
- Are blockchain records admissible as evidence in your courts?
- Do citizens have a legal right to see who accessed their data — and if not, should you provide it anyway as a policy commitment?

None of these questions have universal answers. Section 12 of this guide provides a legal review checklist. Get independent legal advice before going live with real citizen data.

---

**Question 3: Who runs the BSC Authority in your deployment?**

Every BSC instance needs a governing body — the entity responsible for issuing agency credentials, approving smart contract changes, and managing audit oversight. In the national India deployment, this is envisioned as a statutory body similar to UIDAI.

In a state government deployment, this is likely the IT Department or an equivalent.

In a civil society deployment, this is your organisation's board, with a public commitment to the governance model in WHITEPAPER.md Section 12.

You must name this entity before deploying. An ungoverned BSC instance is a liability, not an asset.

---

**Question 4: Are you deploying for real citizens or for demonstration?**

If demonstration: use the prototype at `bsc-prototype/` in the repository. No adaptation needed. Just run it.

If real citizens: read this entire guide. Every section applies.

---

## 2. Deployment Modes — Pick One

BSC can be deployed in four modes depending on your resources, authority, and goals.

---

### Mode A — Full Stack Deployment
**Who:** State or national government with statutory authority and IT infrastructure  
**What you run:** All four layers — blockchain, API gateway, all four frontends, ZKP module  
**Data:** Real citizen data from connected agencies  
**Infrastructure:** Minimum 3 blockchain peer nodes, API server, PostgreSQL, Redis, IPFS node  
**Effort:** 3–6 months with a small team  
**Outcome:** Production-grade transparency system

---

### Mode B — Public Dashboard Only
**Who:** Civil society organisation, research institution, or journalism outlet  
**What you run:** Public Dashboard frontend + read-only API + PostgreSQL  
**Data:** Publicly available data only (election affidavits, public company records, RTI-sourced data)  
**Infrastructure:** One server, one database — can run on a ₹2,000/month VPS  
**Effort:** 2–4 weeks  
**Outcome:** A publicly accessible politician wealth tracker with no citizen data privacy concerns

---

### Mode C — Property Registry Module Only
**Who:** State government wanting to start with land records before full deployment  
**What you run:** Blockchain layer + PROPERTY_TRANSFER_VALIDATOR contract + property API endpoints + property section of citizen dashboard  
**Data:** State land registry records only  
**Infrastructure:** 2 peer nodes minimum, API server, PostgreSQL  
**Effort:** 6–10 weeks  
**Outcome:** Tamper-proof property registry with fraud prevention and public ownership verification

---

### Mode D — Research and Pilot
**Who:** Academic institution, think tank, or policy organisation running a controlled pilot  
**What you run:** Full stack with synthetic data or anonymised historical data  
**Data:** Dummy data or anonymised real data with IRB/ethics approval  
**Infrastructure:** Can run entirely on one developer laptop via Docker  
**Effort:** 1–2 weeks  
**Outcome:** Working demonstration for research, grant applications, or policy advocacy

---

## 3. What You Must Change

These are not optional. If you deploy BSC without making these changes, the system will not work correctly or will create legal and technical problems.

---

### 3.1 Identity Hashing Configuration

BSC stores `aadhaar_hash` and `pan_hash` — SHA-256 hashes of India's national identity numbers. For any other jurisdiction, replace these with the equivalent national identifier.

**File to change:** `api/src/config/identity.config.ts`

**What to replace:**

| BSC Default | Your Replacement |
|---|---|
| `aadhaar_hash` | Hash of your national ID number (SSN, NIN, NRIC, etc.) |
| `pan_hash` | Hash of your tax registration number |
| `wallet_address` derivation | Same formula, different input fields |

**The rule:** Never store the raw identifier. Always store only the hash. SHA-256 is the minimum. The hash must be salted with a deployment-specific secret so that the same ID number produces a different hash in your instance than in any other deployment — preventing cross-instance correlation attacks.

**How to set the salt:** In your `.env` file, set `IDENTITY_HASH_SALT=your-deployment-specific-secret`. Generate this with a cryptographically secure random number generator. Never share it. Never commit it to the repository.

---

### 3.2 Currency and Locale

All monetary values in BSC display and calculate in Indian Rupees (₹). Every threshold in the smart contracts is expressed in INR.

**Files to change:**
- `api/src/config/locale.config.ts` — currency symbol, formatting, decimal separator
- `blockchain/chaincode/anomaly/thresholds.go` — all monetary thresholds
- `frontend/*/src/utils/format.ts` — display formatting functions

**What to change:**

```
CURRENCY_SYMBOL     = ₹  →  your symbol ($, €, £, ₦, etc.)
CURRENCY_CODE       = INR  →  your ISO 4217 code
DECIMAL_SEPARATOR   = .  →  your locale's separator
THOUSANDS_SEPARATOR = ,  →  your locale's separator
AMOUNT_UNIT         = 1  →  1 (most currencies) or 100 if displaying in paise/cents
```

**Threshold translation:** All smart contract thresholds in Section 7 of the whitepaper are in INR. Translate them to your currency using purchasing power parity (PPP), not nominal exchange rates. A ₹1 crore threshold in India is not equivalent to $1.2 million in the United States — the appropriate threshold depends on your country's income distribution and cost of living.

---

### 3.3 Property Data Format

India's property records use survey numbers, khasra numbers, and khata numbers as identifiers. Every country and every Indian state uses different formats.

**File to change:** `api/src/models/property.model.ts` and `blockchain/chaincode/property/property.go`

**Fields that need jurisdiction-specific values:**

| BSC Field | India Default | Your Adaptation |
|---|---|---|
| `survey_number` | Survey/Khasra/Khata No. | Your local cadastral reference format |
| `registration_number` | IGRS/State/Year/Number | Your deed or title number format |
| `circle_rate_value` | State government circle rate | Your government's official valuation method |
| `encumbrance_status` | CLEAR, MORTGAGED, DISPUTED, COURT_STAY | Add or remove statuses for your legal system |
| `transfer_type` | PURCHASE, INHERITANCE, GIFT, COURT_ORDER | Add types specific to your jurisdiction (e.g., COMPULSORY_ACQUISITION) |
| `stamp_duty_paid` | Indian stamp duty | Your equivalent transfer tax |

---

### 3.4 Agency List and Permissions

The ACCESS_PERMISSION_ENFORCER contract has a hardcoded list of agencies and their permission levels. This list is India-specific.

**File to change:** `blockchain/chaincode/access/agencies.go`

Replace:

```
IT_DEPT    → Your tax authority
ED         → Your financial crimes unit
CBI        → Your national investigation agency
COURT      → Your judiciary
BANK       → Your regulated financial institutions
CITIZEN_SELF → Keep this — it is universal
ADMIN      → Keep this — it is universal
LOKPAL     → Your anti-corruption ombudsman (if applicable)
```

Add any agencies specific to your jurisdiction. Remove any that do not exist. Every agency you add must have a defined permission scope — use the table in WHITEPAPER.md Section 7 as your template.

---

### 3.5 Smart Contract Thresholds

The anomaly detection rules in WEALTH_ANOMALY_DETECTOR use specific thresholds calibrated for India. These must be recalibrated for your jurisdiction.

See Section 11 of this guide for the full threshold calibration methodology.

---

## 4. What You Should Change

These are not technically required but strongly recommended for a production deployment.

---

### 4.1 Language and Localisation

The entire frontend is in English. For any deployment where English is not the primary language of your target users:

- Citizen Dashboard must be in the citizen's first language
- Error messages and flag explanations must be in the local language
- Plain-language explanations of anomaly flags are critical — a citizen who cannot understand why they were flagged cannot exercise their right to respond

**How BSC handles i18n:** All user-facing strings are in `frontend/*/src/i18n/en.json`. Create a parallel file for each language you need. The React i18n setup is already in place — you only need to add translation files.

**Priority order for translation:**
1. Citizen Dashboard — highest priority, touches the most vulnerable users
2. Public Dashboard — second priority, broadest audience
3. Officer Console — English is acceptable if your officers are English-proficient
4. Admin Panel — English is acceptable

---

### 4.2 Flag Explanation Text

The plain-language explanations shown to citizens when a flag is raised are in:
`api/src/content/flag-explanations/en.md`

These explanations reference Indian legal concepts (IT Department, ED, ITR, Benami Act). Replace all Indian-specific legal references with the equivalent in your jurisdiction.

The explanation must answer three questions for the citizen:
- Why was I flagged? (plain language, no jargon)
- What does this mean for me right now? (nothing until an officer takes action)
- What can I do? (submit explanation, upload documents)

---

### 4.3 Map Configuration

The property map in the Citizen Dashboard uses OpenStreetMap via Leaflet.js. OpenStreetMap works everywhere in the world and is free. No changes needed for basic functionality.

**What you may want to change:**
- Default map centre coordinates (currently defaults to India's geographic centre)
- Default zoom level
- Whether to show state/district boundary overlays (requires a GeoJSON file for your jurisdiction)

**File to change:** `frontend/citizen/src/config/map.config.ts`

---

### 4.4 KYC Level Definitions

BSC has three KYC levels:
- Level 1: Identity only (Aadhaar-equivalent verified)
- Level 2: Financial linked (bank accounts connected)
- Level 3: Full asset linked (property, financial, business all connected)

These definitions may need to adapt to your jurisdiction's KYC norms, particularly if you have a national KYC registry (like India's CKYC) that defines KYC levels differently.

**File to change:** `api/src/config/kyc.config.ts`

---

## 5. What You Must Not Change

These are the parts of BSC that exist for fundamental security and integrity reasons. Changing them undermines the system's core guarantees.

---

### 5.1 The Access Log Architecture

Every single data access must be logged to the blockchain. Do not:
- Add a way to bypass logging for "internal" or "system" accesses
- Create a bulk access mode that logs one entry for many accesses
- Allow retroactive deletion or modification of access logs

The entire citizen trust model rests on the guarantee that the access log is complete and tamper-proof. Any exception to this guarantee — however well-intentioned — destroys the guarantee entirely.

---

### 5.2 Raw Identifier Storage

Never store raw Aadhaar numbers, PAN numbers, social security numbers, national identity numbers, or any other direct personal identifier. Always hash. Always salt. If a database breach occurs, hashed and salted identifiers cannot be reversed. Raw identifiers can.

---

### 5.3 Exact Financial Balance Storage

BSC deliberately stores only balance ranges, never exact amounts. This is not a technical limitation — it is a privacy design decision. An agency that needs to know someone's exact balance for a legitimate purpose must go through the ZKP verification path or obtain a court order.

Do not modify the financial asset data model to store exact balances, even if a connected agency provides them. Discard the exact amount and store only the range.

---

### 5.4 The Citizen Notification System

When a government agency accesses a citizen's data, the citizen is notified within one hour. Do not disable or delay this notification. Do not allow agencies to suppress notifications for their own accesses.

If an agency objects to notifications because they are concerned about tipping off a suspect: the answer is that suspects can see their own access log, not the content of the investigation. Notification that someone looked at your data is not the same as notification of what they concluded.

---

### 5.5 The ZKP Privacy Guarantee

The ZKP module must never log or store the private inputs (the actual citizen data) used to generate a proof. Only the proof itself and its hash are stored on-chain. If you add logging to the ZKP module for debugging, ensure those logs are deleted and never reach persistent storage.

---

## 6. Adapting for Indian State Governments

This section is specifically for state government deployments within India. You are operating within the same legal framework as the national BSC design, which simplifies adaptation significantly.

---

### 6.1 What You Already Have

If you are a state government, you likely already have:

- **State land registry data** — the core property records
- **UIDAI API access** (or the ability to obtain it) — for Aadhaar-based identity verification
- **State IT infrastructure** — NIC data centres or state data centres
- **Legal authority** — state land registration acts give you clear authority over property records

This means you can run Mode C (Property Registry Module) immediately with minimal legal complexity, and expand to full Mode A as you obtain additional data access agreements.

---

### 6.2 State-Specific Property Formats

Each Indian state uses different terminology and formats for property records. Map your state's format to BSC's data model:

| State | Local Term | BSC Field |
|---|---|---|
| Maharashtra | City Survey Number / Gut Number | `survey_number` |
| Karnataka | Sy. No. / Hissa No. | `survey_number` |
| Tamil Nadu | Survey No. / Sub-division No. | `survey_number` |
| Uttar Pradesh | Khasra No. / Khata No. | `survey_number` |
| Rajasthan | Khasra No. / Khatoni No. | `survey_number` |
| West Bengal | Dag No. / Khatian No. | `survey_number` |
| Gujarat | Survey No. / Block No. | `survey_number` |
| Bihar | Khata No. / Khesra No. | `survey_number` |

For your specific state, check your land records department's data dictionary for the exact field names and formats.

---

### 6.3 Circle Rate Integration

Circle rates are set by district and sub-registrar zone, and they change periodically. BSC needs to:
- Store the circle rate at the time of registration (not the current rate — historical accuracy matters)
- Flag transactions where declared value is less than 80% of the circle rate

**Integration approach:**
1. Your IT department maintains a circle rate table in PostgreSQL
2. The PROPERTY_TRANSFER_VALIDATOR contract queries this table via the API before validation
3. The table is updated when the state government revises circle rates
4. Historical rate records are never deleted — only new rows added

---

### 6.4 RERA Integration

If your state has RERA (Real Estate Regulatory Authority) data, it is highly valuable for BSC. RERA project registrations can validate that a property being sold was legally approved, and RERA agent data can flag cases where unregistered agents are facilitating transactions.

RERA data is typically available via state RERA APIs. Add it as an additional data source in the property validation pipeline.

---

### 6.5 State-Level Governance

For a state-level BSC deployment, the governance body could be:
- The Revenue Department (for land records focus)
- The State IT Department (for full-stack deployment)
- A dedicated State Transparency Authority (preferred for long-term independence)

A dedicated authority is preferable because it places BSC outside the normal departmental hierarchy — preventing the awkward situation where the department that is a data source is also the department that governs the system that scrutinises it.

---

## 7. Adapting for Foreign Governments

This section is for governments outside India adapting BSC for their own country.

---

### 7.1 The Three Things That Change Most

**National Identity System** — Every country has one. Section 9 maps the most common systems to BSC's identity model.

**Property Registration System** — Every country has one. The concepts are universal (owner, property, value, transfer) even if the formats differ completely.

**Legal and Regulatory Framework** — Covered in Sections 12 and 13.

---

### 7.2 Jurisdictions Where BSC is Most Directly Applicable

**High fit — immediate adaptation possible:**
- Bangladesh (similar legal system, similar property registration, NID instead of Aadhaar)
- Sri Lanka (similar legal system, NIC instead of Aadhaar, Land Registry records available)
- Nepal (similar challenges, Citizenship Certificate as identity, land records partially digitised)
- Myanmar (significant land governance challenges, NRC as identity)

**Medium fit — moderate adaptation required:**
- Kenya (Huduma Namba as identity, eCitizen land registry, similar corruption challenges)
- Ghana (Ghana Card as identity, Land Administration Project data available)
- Nigeria (NIN as identity, significantly more complex land tenure system)
- Philippines (PhilSys ID as identity, LRA land registry)

**High fit with significant legal adaptation:**
- Brazil (CPF as identity, SREI property registry, robust legal system)
- Indonesia (NIK as identity, BPN land registry)
- Mexico (CURP as identity, RPP property registry)

---

### 7.3 What to Prioritise in the First 90 Days

1. Map your national ID to the CitizenNode identity model (Section 9)
2. Map your property registration format to BSC's PropertyRecord (Section 10)
3. Identify which smart contract rules apply in your legal context
4. Get legal sign-off on the data protection compliance questions (Section 12)
5. Run Mode D (research pilot) with synthetic data before touching real citizen data
6. Identify your governance body
7. Brief your data protection authority — do not surprise them

---

## 8. Adapting for Civil Society Organisations

If you are an NGO, research institution, or journalism organisation, you are most likely deploying Mode B (Public Dashboard Only). This section is for you.

---

### 8.1 What Data You Can Use Without Legal Issues

Publicly available data that requires no special authority:
- Election Commission affidavits (India) — public domain
- MCA21 company records — public API available
- Parliament and state legislature member declarations — public domain
- RTI-sourced property records — legal to publish
- RERA project registrations — public API in most states

This data alone, structured and linked through BSC's data model, is significantly more powerful than the current state of scattered PDFs and isolated databases.

---

### 8.2 What You Cannot Do

- Connect to Aadhaar or bank data — requires statutory authority you do not have
- Process private citizen data without explicit consent — DPDPA applies to you too
- Claim your instance is "official" — be clear this is an independent civil society deployment

---

### 8.3 The "Public Figures Only" Rule

As a civil society deployment, restrict your public dashboard to public figures — politicians, public officials, judges, senior bureaucrats. Do not attempt to build a general citizen wealth database. Not only is this legally risky, it undermines the argument that BSC protects citizen privacy.

The political argument for BSC is: public figures who exercise public power must be transparent; private citizens who do not must be protected. Maintain this distinction clearly in your deployment.

---

### 8.4 Infrastructure for Civil Society Deployment

Mode B can run on:
- **Render.com** free tier: frontend + API (with sleep after inactivity — acceptable for low-traffic deployments)
- **Railway.app** free tier: PostgreSQL database
- **Vercel** free tier: React frontend (highly recommended — globally fast CDN)
- **web3.storage** free tier: IPFS document storage (5 GB free)
- **GitHub Actions** free tier: CI/CD pipeline

**Total monthly infrastructure cost: ₹0**

As your traffic grows and you need always-on infrastructure, the smallest paid tier on Render or Railway costs approximately ₹800–1,500 per month. This is well within the budget of any functioning civil society organisation.

---

## 9. National Identity System Mapping

BSC uses two identity anchors: a biometric-verified national ID (Aadhaar equivalent) and a tax registration number (PAN equivalent). Map your country's systems to these fields.

| Country | National ID | Tax ID | Notes |
|---|---|---|---|
| India | Aadhaar (12 digits) | PAN (10 chars) | Original BSC design |
| Bangladesh | NID (17 digits) | TIN (12 digits) | Direct mapping |
| Sri Lanka | NIC (9+1 or 12 digits) | TIN (9 digits) | Direct mapping |
| Kenya | Huduma Namba | KRA PIN | Direct mapping |
| Nigeria | NIN (11 digits) | TIN (10 digits) | Direct mapping |
| Ghana | Ghana Card | TIN | Direct mapping |
| Philippines | PhilSys Number | TIN | Direct mapping |
| Brazil | CPF (11 digits) | CNPJ for business | CPF serves both purposes |
| Indonesia | NIK (16 digits) | NPWP | Direct mapping |
| United Kingdom | No universal ID | UTR / NI Number | Use NI Number + UTR |
| United States | SSN (9 digits) | EIN for business | Use SSN as both anchors |
| Germany | Personalausweis ID | Steueridentifikationsnummer | Both 11 digits |

**For countries without a universal national ID:** Use the combination of (tax registration number + date of birth + full legal name hash) as the identity anchor. This is less reliable than a biometric-verified ID but functional. Flag in your deployment documentation that identity confidence is lower until a national ID system is established.

---

## 10. Land Registry Format Mapping

Map your jurisdiction's property registration format to BSC's PropertyRecord data model.

### 10.1 Fields That Map Directly Everywhere

These concepts exist in every land registry system in the world:

| BSC Field | Universal Equivalent |
|---|---|
| `owner_node_id` | Registered owner's identity |
| `property_type` | Land use classification |
| `area_sqft` | Area measurement (convert from local unit if needed) |
| `declared_value` | Transaction price as declared at registration |
| `registration_date` | Date of deed/title transfer |
| `registration_number` | Deed number / title number / folio number |
| `transfer_type` | Method of acquisition |
| `encumbrance_status` | Mortgage / lien / dispute status |

### 10.2 Fields That Need Local Calibration

| BSC Field | India Value | How to Adapt |
|---|---|---|
| `circle_rate_value` | Government floor price per sq.ft by zone | Use your government's official valuation method (assessed value, cadastral value, rateable value) |
| `market_estimate` | Estimated from comparable transactions | Same methodology — use recent comparable sales in the area |
| `stamp_duty_paid` | Indian stamp duty | Your jurisdiction's transfer tax, registration fee, or equivalent |
| `document_hash` | IPFS hash of sub-registrar document | IPFS hash of your title deed or equivalent document |

### 10.3 Area Unit Conversion

BSC stores area in square feet. Convert from your local unit:

| Local Unit | Multiply By | To Get Sq.Ft |
|---|---|---|
| Square metres | 10.764 | Sq.ft |
| Acres | 43,560 | Sq.ft |
| Hectares | 107,639 | Sq.ft |
| Bigha (varies by state) | 26,910 (UP) / 14,400 (Bengal) | Sq.ft |
| Guntha | 1,089 | Sq.ft |
| Cent | 435.6 | Sq.ft |

Store the converted value in `area_sqft`. Also store the original value and unit in `area_local_value` and `area_local_unit` for reference.

---

## 11. Smart Contract Threshold Calibration

The anomaly detection thresholds in WEALTH_ANOMALY_DETECTOR are calibrated for India. If you deploy BSC in a different economic context, you must recalibrate these thresholds or you will get either too many false positives (flagging ordinary wealth) or too many false negatives (missing real anomalies).

---

### 11.1 The Calibration Methodology

For each threshold, the methodology is the same:

1. **Get the median household income** in your jurisdiction (official statistics)
2. **Get the median property value** in your jurisdiction (official statistics or comparable sales data)
3. **Calculate the ratio** that separates normal wealth accumulation from suspicious wealth accumulation in your economic context
4. **Back-test against known cases** — apply the threshold to historical cases where corruption was proven and cases where it was not. Adjust until you minimise both false positives and false negatives.
5. **Document your methodology** — every threshold must have a documented justification. Arbitrary thresholds are legally indefensible.

---

### 11.2 Rule-by-Rule Calibration

**Rule 1 — Basic Income Asset Mismatch**

```
BSC Default: assets_acquired_this_year > declared_income_this_year × 2

Calibration question: In your economy, what multiple of annual income
does a person typically save and invest in one year?
In India: 1.5–2× is unusual. 3× is suspicious.
In a high-savings economy (Singapore, Japan): 2× is normal. 4× is suspicious.
In a low-income economy (sub-Saharan Africa): 1× is unusual. 2× is suspicious.

Adjust the multiplier (currently 2) based on your savings rate data.
```

**Rule 2 — Serious Unexplained Wealth**

```
BSC Default: total_net_worth > cumulative_5yr_income × 4

Calibration question: What is a reasonable ceiling for wealth
accumulation over 5 years through legitimate means?
This includes savings, investment returns, inheritance.
In India: 4× is conservative — legitimate HNI individuals can exceed this.
Adjust based on your country's top decile savings and investment data.
```

**Rule 3 — Public Official Wealth Surge**

```
BSC Default: net_worth_growth_3yr > 300%

This rule is specifically for public officials and politicians.
The question is: what growth rate is achievable on a civil servant's
salary through legitimate savings and investment?

In India: A senior IAS officer earning ₹2.5L/month can legitimately
grow wealth at 10–15% annually through mutual funds.
300% in 3 years (~44% CAGR) is beyond legitimate investment returns.

Calculate your country's civil servant salary bands and the maximum
legitimate investment return to set this threshold.
```

**Rule 4 — Benami Suspicion**

```
BSC Default: properties_in_family_names > 3
AND family_combined_income < total_property_value × 0.2

This rule is highly India-specific — the concept of benami
(property held in another's name) has a specific legal definition
in Indian law. Adapt based on your jurisdiction's equivalent concept.

If your jurisdiction does not have a specific benami-equivalent law,
this rule can still flag for "family wealth concentration" —
change the label and the legal reference but keep the logic.
```

**Rule 5 — Shell Company Link**

```
BSC Default: business_count > 5
AND any company DORMANT or STRUCK_OFF
AND company_turnover_combined < lifestyle_expenditure

Calibration question: In your jurisdiction, how many companies
does a legitimate businessperson typically own?
In India: Most legitimate SME owners have 1–3 companies.
In a holding company structure: 5–10 is legitimate.
Adjust the count threshold based on your business registration norms.
```

---

### 11.3 Threshold Review Process

Set a calendar reminder to review all thresholds annually. Economic conditions change. Inflation affects monetary thresholds. What was suspicious in 2024 may be normal in 2030 for purely inflationary reasons.

Every threshold change must go through the smart contract change process described in WHITEPAPER.md Section 12. Thresholds are not configuration — they are policy. Treat them accordingly.

---

## 12. Legal Review Checklist

Complete this checklist before going live with real citizen data. Get independent legal advice — this checklist is a starting point, not a substitute for legal counsel.

---

### 12.1 Data Protection and Privacy

- [ ] Identified the applicable data protection law in your jurisdiction
- [ ] Confirmed that connecting property and financial data under a single identity is permitted under that law
- [ ] Confirmed that the balance range approach (no exact amounts) satisfies the data minimisation requirement
- [ ] Confirmed that the citizen notification requirement is compatible with your law (some jurisdictions require notification before access, not after)
- [ ] Confirmed that the access log architecture satisfies your data retention requirements
- [ ] Briefed your data protection authority on the deployment and received no objection
- [ ] Documented the legal basis for each category of data processing

### 12.2 Evidence and Admissibility

- [ ] Researched whether blockchain records are admissible as evidence in your courts
- [ ] If admissibility is uncertain, consulted with a technology law expert
- [ ] Documented the chain of custody from original data source to BSC record to potential court use
- [ ] Confirmed that the cryptographic signing mechanism meets your jurisdiction's electronic signature requirements

### 12.3 Agency Authority

- [ ] Confirmed that each connected agency has statutory authority to share data with BSC
- [ ] Documented the legal instrument authorising each data sharing arrangement (MOU, legislation, executive order)
- [ ] Confirmed that the permission levels in ACCESS_PERMISSION_ENFORCER align with each agency's legal authority

### 12.4 Citizen Rights

- [ ] Confirmed that citizens have a right to access their own BSC data
- [ ] Established a process for citizens to dispute incorrect records
- [ ] Established a process for citizens to report unauthorised access
- [ ] Documented what happens to BSC data if BSC is shut down (data portability)

### 12.5 Cross-Border Data

- [ ] If your deployment involves cross-border data flows, confirmed compliance with applicable data localisation requirements
- [ ] Confirmed that the IPFS document storage approach complies with your data residency requirements

---

## 13. Data Privacy Compliance by Jurisdiction

A brief summary of the key requirements in major jurisdictions where BSC adaptation is likely. This is not legal advice — consult qualified counsel in your jurisdiction.

---

### India — Digital Personal Data Protection Act, 2023

**Key requirements relevant to BSC:**
- Consent required for personal data processing (BSC relies on statutory authority, which DPDPA recognises as an alternative to consent for government functions)
- Data minimisation — BSC's range-based financial storage complies
- Purpose limitation — access logging enforces this technically
- Grievance redressal — citizen dashboard provides this
- Data localisation — store all data in India-based infrastructure

**BSC compliance status:** Designed for DPDPA compliance. Independent legal review recommended before production deployment.

---

### Kenya — Data Protection Act, 2019

**Key requirements relevant to BSC:**
- Lawful basis for processing required — statutory authority or legitimate interest
- Data subject rights including access and correction
- Cross-border transfer restrictions — store data in Kenya
- Registration with the Office of the Data Protection Commissioner required

---

### Nigeria — Nigeria Data Protection Regulation (NDPR), 2019

**Key requirements relevant to BSC:**
- Lawful basis required — government authority or consent
- Data subject notification within 72 hours of breach
- Data Protection Impact Assessment (DPIA) required for large-scale processing
- Nigerian Data Protection Bureau oversight

---

### European Union — GDPR

**Key requirements relevant to BSC:**
- Lawful basis — for government deployments, public task (Article 6(1)(e))
- Data minimisation — BSC's design is GDPR-aligned
- Right to erasure — conflicts with blockchain immutability. Resolution: personal data stored off-chain in PostgreSQL (deletable); only hashes and anonymised records on-chain
- Data Protection Impact Assessment mandatory for this type of large-scale processing
- Data Protection Officer appointment likely required

**Special consideration for GDPR:** The right to erasure ("right to be forgotten") is incompatible with blockchain immutability as commonly understood. BSC's hybrid architecture resolves this: delete the PostgreSQL record (the primary personal data store) and the blockchain record becomes an orphan hash with no linkable personal data. Document this approach in your DPIA.

---

### United States — Varied by State

The US has no federal equivalent to GDPR. Relevant frameworks:
- California CCPA/CPRA for California deployments
- State-specific data breach notification laws
- GLBA for financial data
- Section 5 of the FTC Act (unfair or deceptive practices)

A federal government or multi-state deployment would need a constitutional and statutory authority analysis that is beyond the scope of this guide.

---

## 14. Infrastructure Requirements

### 14.1 Minimum Production Setup (Mode A — Full Stack)

| Component | Minimum Spec | Recommended |
|---|---|---|
| Blockchain peer nodes | 3 × 4 CPU, 8 GB RAM, 500 GB SSD | 3 × 8 CPU, 16 GB RAM, 1 TB SSD |
| Orderer node | 1 × 2 CPU, 4 GB RAM | 2 × 4 CPU, 8 GB RAM (for redundancy) |
| API server | 2 × 4 CPU, 8 GB RAM | 4 × 4 CPU, 16 GB RAM (load balanced) |
| PostgreSQL | 4 CPU, 16 GB RAM, 2 TB SSD | 8 CPU, 32 GB RAM, 4 TB SSD (with replica) |
| Redis | 2 CPU, 4 GB RAM | 4 CPU, 8 GB RAM |
| IPFS node | 2 CPU, 4 GB RAM, 2 TB storage | Use web3.storage or Pinata instead |
| Frontend (CDN) | Vercel or Cloudflare Pages | Same — CDN is always preferred |

**Network requirements:**
- All inter-node communication over private network (not public internet)
- TLS 1.3 on all public-facing endpoints
- VPN or private link between data centres if multi-DC deployment

### 14.2 Minimum Pilot Setup (Mode C or D)

Runs entirely on a single developer-grade machine or small VPS:
- 4 CPU, 16 GB RAM, 100 GB SSD
- Docker and Docker Compose installed
- `docker compose up` starts everything

This is suitable for pilots with up to approximately 10,000 records and 100 concurrent users.

### 14.3 Mode B — Public Dashboard Only

Can run on:
- 2 CPU, 2 GB RAM VPS (₹500–800/month on DigitalOcean, Linode, or Hetzner)
- Vercel free tier for the React frontend
- Railway or Supabase free tier for PostgreSQL

Total cost: ₹500–800/month for a production-quality public dashboard.

---

## 15. Going Live — Checklist

Complete every item before accepting real citizen data.

### Technical

- [ ] All four smart contracts deployed and tested on a Hyperledger Fabric testnet for minimum 30 days
- [ ] API endpoints tested with Postman collection (available in `api/tests/postman/`)
- [ ] ZKP circuits tested with known inputs and verified outputs
- [ ] Load test completed at 2× expected peak traffic
- [ ] Security penetration test completed by an independent firm
- [ ] All hardcoded test credentials and API keys removed
- [ ] Environment variables properly configured (no secrets in repository)
- [ ] Database backup and recovery tested
- [ ] Disaster recovery runbook written and tested

### Legal and Governance

- [ ] Legal review checklist (Section 12) completed
- [ ] BSC Authority constituted with named members
- [ ] Smart contract change process documented and communicated to all agencies
- [ ] Citizen grievance process live and tested
- [ ] Data protection authority briefed
- [ ] All agency data sharing agreements signed

### Communication

- [ ] Citizen communication plan ready (what to tell citizens before launch)
- [ ] Agency training completed for all connected agencies
- [ ] Officer training completed for the investigation console
- [ ] Media briefing prepared (journalists will ask questions — be ready)
- [ ] Public announcement of the data sources and their freshness published

---

## 16. Getting Help

### Community Support

- **GitHub Discussions:** For architecture questions, adaptation questions, and general discussion
- **GitHub Issues:** For bug reports and feature requests
- **GitHub Discussions → Show and Tell:** Post your adaptation — what jurisdiction, what changes, what challenges

### Contributing Your Adaptation Back

If you have adapted BSC for a new jurisdiction, please contribute your adaptation work back to the repository:

- Your locale configuration files
- Your property format mapping
- Your smart contract threshold calibration and methodology
- Your legal review findings (redacted as appropriate)

Every adaptation makes BSC better for every other jurisdiction. A Nigerian civil servant's adaptation work helps a Bangladeshi government researcher. This is the compounding value of open source.

### What Not to Contribute Back

- Real citizen data of any kind
- Internal government documents
- Anything covered by confidentiality obligations
- Security vulnerability details (use the private security disclosure process in `SECURITY.md`)

---

*Bharat Sampada Chain — Built by Citizens, For Citizens.*  
*Fork it. Adapt it. Deploy it. Make your country more transparent.*

---

**Document maintained by the BSC open source community.**  
**Last updated: April 2024**  
**Suggest improvements via GitHub Pull Request.**
