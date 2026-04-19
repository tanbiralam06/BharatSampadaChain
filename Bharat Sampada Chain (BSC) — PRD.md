# **Bharat Sampada Chain (BSC) — Product Requirements Document (PRD)**

---

## **Document Information**

**Product Name:** Bharat Sampada Chain (BSC) **Version:** 1.0 **Type:** Prototype PRD **Purpose:** Build a working prototype to demonstrate India's Unified Blockchain Wealth Transparency System

---

## **1\. Product Vision**

**One Line:** A tamper-proof, privacy-respecting blockchain system that links every Indian citizen's property, land, bank balances, and financial assets to a single verifiable ledger — making wealth opacity impossible.

**The Problem BSC Solves:** India loses ₹7–10 lakh crore annually to tax evasion, benami property, and welfare fraud — not because the data doesn't exist, but because it lives in silos that nobody connects. Aadhaar knows your identity. Banks know your balance. Land registries know your property. But nobody connects them. BSC connects them.

**North Star Metric:** Number of asset records verifiably linked to citizen identity nodes on the blockchain.

---

## **2\. Target Users**

**User Type 1 — The Citizen** A regular Indian citizen who wants to view their own asset profile, understand what the government can see about them, and control access to their data.

Goals: See my own wealth profile, know who accessed my data, update my asset declarations.

Pain points: Fear of government misuse, not understanding what is already visible about them.

**User Type 2 — The IT Officer** An Income Tax Department official investigating a wealth mismatch case flagged by the system.

Goals: See a clear income vs asset comparison for a flagged individual, access supporting documents, initiate formal investigation.

Pain points: Currently manually cross-references multiple disconnected databases, slow and error-prone.

**User Type 3 — The Public Observer** A journalist, activist, or ordinary citizen wanting to check a politician's declared wealth growth over time.

Goals: See a politician's total asset growth across election cycles, compare declared vs estimated wealth.

Pain points: Currently election affidavits are scanned PDFs buried in ECI website, impossible to analyze.

**User Type 4 — The System Administrator** A BSC Authority technical officer managing node health, access logs, and smart contract updates.

Goals: Monitor system performance, audit all data access events, manage agency permissions.

---

## **3\. Scope of Prototype**

The prototype is NOT the full national system. It is a working demonstration that proves the concept is technically feasible and shows what the full system would look like.

**In Scope for Prototype:**

* Synthetic citizen identity nodes (no real Aadhaar data)  
* Property registry with real publicly available registration data from 1–2 states  
* Financial asset stub (simulated bank balance ranges and investment totals)  
* Smart contract anomaly detection engine  
* Citizen dashboard (view own profile)  
* Public official transparency dashboard  
* IT officer investigation console  
* Access log and audit trail  
* ZKP demonstration module (simplified)

**Out of Scope for Prototype:**

* Real Aadhaar/PAN integration (requires UIDAI approval)  
* Live bank data feeds (requires RBI mandate)  
* Full national land record ingestion  
* Court system integration  
* Production-grade security hardening  
* Mobile application

---

## **4\. System Architecture Overview**

The system has three layers:

**Layer 1 — Blockchain Layer** This is the core ledger. All asset records, identity nodes, transaction history, and smart contract logic live here. Nobody can modify a record once written. Every write is signed by the writing agency's cryptographic key.

**Layer 2 — API Gateway Layer** This sits between the blockchain and the user-facing applications. It handles authentication, permission checking, data formatting, and ZKP verification. No application ever touches the blockchain directly — everything goes through the API gateway.

**Layer 3 — Application Layer** These are the actual user interfaces — citizen dashboard, officer console, public dashboard, admin panel. Each application only receives the data it is permitted to see, filtered by the API gateway based on user role.

---

## **5\. Data Models**

### **5.1 Citizen Identity Node**

This is the central record that everything else links to.

CitizenNode {  
  node\_id:              string  — unique BSC identifier (UUID v4)  
  aadhaar\_hash:         string  — SHA256 of Aadhaar number (never store raw Aadhaar)  
  pan\_hash:             string  — SHA256 of PAN number  
  wallet\_address:       string  — derived from SHA256(aadhaar\_hash \+ pan\_hash)  
  node\_type:            enum    — \[CITIZEN, PUBLIC\_OFFICIAL, POLITICIAN, GOVT\_EMPLOYEE\]  
  kyc\_level:            integer — \[1=identity only, 2=financial linked, 3=full asset linked\]  
  created\_at:           timestamp  
  last\_updated:         timestamp  
  is\_active:            boolean  
  linked\_property\_ids:  string\[\]  
  linked\_bank\_ids:      string\[\]  
  linked\_investment\_ids: string\[\]  
  linked\_business\_ids:  string\[\]  
  total\_declared\_income\_5yr: number — from ITR filings  
  anomaly\_flag\_status:  enum    — \[CLEAR, YELLOW, RED, UNDER\_INVESTIGATION\]  
}

### **5.2 Property Record**

Every land or property asset linked to a citizen node.

PropertyRecord {  
  property\_id:          string  — unique BSC property identifier  
  owner\_node\_id:        string  — links to CitizenNode  
  previous\_owner\_id:    string  — links to previous CitizenNode (chain of ownership)  
  survey\_number:        string  — from state land records  
  district:             string  
  state:                string  
  property\_type:        enum    — \[AGRICULTURAL\_LAND, RESIDENTIAL, COMMERCIAL, INDUSTRIAL, PLOT\]  
  area\_sqft:            number  
  area\_acres:           number  
  declared\_value:       number  — value as declared at registration  
  circle\_rate\_value:    number  — government circle rate valuation  
  market\_estimate:      number  — estimated from recent comparable transactions  
  registration\_date:    timestamp  
  registration\_number:  string  
  document\_hash:        string  — IPFS hash of registration document  
  encumbrance\_status:   enum    — \[CLEAR, MORTGAGED, DISPUTED, COURT\_STAY\]  
  mortgage\_amount:      number  — if mortgaged  
  transfer\_type:        enum    — \[PURCHASE, INHERITANCE, GIFT, COURT\_ORDER\]  
  stamp\_duty\_paid:      number  
  blockchain\_tx\_hash:   string  — transaction hash when this record was written  
  created\_at:           timestamp  
}

### **5.3 Financial Asset Record**

Bank accounts, investments, and other financial holdings.

FinancialAsset {  
  asset\_id:             string  
  owner\_node\_id:        string  
  asset\_type:           enum    — \[BANK\_ACCOUNT, FD, MUTUAL\_FUND, STOCKS, DEMAT,  
                                   PPF, EPF, NPS, INSURANCE, CRYPTO, FOREIGN\_ASSET\]  
  institution\_name:     string  
  institution\_code:     string  — RBI/SEBI registered code  
  balance\_range:        enum    — \[UNDER\_1L, 1L\_TO\_10L, 10L\_TO\_1CR, 1CR\_TO\_10CR,  
                                   10CR\_TO\_100CR, ABOVE\_100CR\]  
                                   — exact amounts never stored for privacy  
  approximate\_value:    number  — midpoint of range for anomaly calculation  
  as\_of\_date:           timestamp  
  source\_agency:        string  — which agency reported this  
  verification\_status:  enum    — \[SELF\_DECLARED, AGENCY\_VERIFIED, AUDITED\]  
  is\_joint\_account:     boolean  
  joint\_owner\_node\_id:  string  — if joint  
  created\_at:           timestamp  
  last\_synced:          timestamp  
}

### **5.4 Business Ownership Record**

Links citizens to companies they own or beneficially control.

BusinessOwnership {  
  ownership\_id:         string  
  owner\_node\_id:        string  
  company\_cin:          string  — MCA21 Corporate Identification Number  
  company\_name:         string  
  ownership\_type:       enum    — \[DIRECT, BENEFICIAL, NOMINEE, DIRECTOR\]  
  ownership\_percentage: number  
  paid\_up\_capital:      number  
  last\_annual\_turnover: number  
  company\_status:       enum    — \[ACTIVE, DORMANT, STRUCK\_OFF, UNDER\_LIQUIDATION\]  
  source:               string  — MCA21  
  created\_at:           timestamp  
}

### **5.5 Anomaly Flag Record**

Every flag raised by smart contracts is stored immutably.

AnomalyFlag {  
  flag\_id:              string  
  citizen\_node\_id:      string  
  flag\_type:            enum    — \[INCOME\_ASSET\_MISMATCH, SUDDEN\_WEALTH\_GAIN,  
                                   BENAMI\_SUSPICION, LIFESTYLE\_MISMATCH,  
                                   SHELL\_COMPANY\_LINK, FOREIGN\_ASSET\_UNDECLARED\]  
  severity:             enum    — \[YELLOW, ORANGE, RED\]  
  triggered\_by:         string  — which smart contract rule triggered this  
  trigger\_data:         JSON    — the specific data points that caused the flag  
  declared\_income\_used: number  
  asset\_value\_used:     number  
  gap\_amount:           number  
  flag\_raised\_at:       timestamp  
  assigned\_to\_agency:   string  
  current\_status:       enum    — \[OPEN, EXPLANATION\_RECEIVED, CLEARED,  
                                   ESCALATED, FIR\_FILED\]  
  resolution\_notes:     string  
  resolved\_at:          timestamp  
}

### **5.6 Access Log Record**

Every single data access is logged permanently and cannot be deleted.

AccessLog {  
  log\_id:               string  
  accessed\_node\_id:     string  — whose data was accessed  
  accessed\_by:          string  — officer ID or agency ID  
  accessing\_agency:     enum    — \[IT\_DEPT, ED, CBI, COURT, BANK, CITIZEN\_SELF, ADMIN\]  
  access\_type:          enum    — \[VIEW, EXPORT, FLAG\_RAISED, FLAG\_CLEARED, FULL\_DISCLOSURE\]  
  data\_fields\_accessed: string\[\] — exactly which fields were viewed  
  purpose:              string  — mandatory reason for access  
  authorization\_ref:    string  — court order number or investigation number  
  ip\_address:           string  
  accessed\_at:          timestamp  
  blockchain\_tx\_hash:   string  — this log itself is written to blockchain  
}

---

## **6\. Smart Contract Specifications**

### **Contract 1 — WEALTH\_ANOMALY\_DETECTOR**

**Trigger:** Runs automatically when a new ITR filing is linked to a citizen node, or when a new property/financial asset is added.

**Rule Set:**

Rule 1 — Basic Income Asset Mismatch

IF (total\_asset\_value\_acquired\_this\_year \> declared\_income\_this\_year \* 2\)  
AND (inheritance\_received \== false)  
AND (approved\_loan\_amount \< gap\_amount)  
THEN raise\_flag(YELLOW, INCOME\_ASSET\_MISMATCH)

Rule 2 — Serious Unexplained Wealth

IF (total\_net\_worth \> cumulative\_5yr\_declared\_income \* 4\)  
AND (no\_legitimate\_source\_documented \== true)  
THEN raise\_flag(RED, INCOME\_ASSET\_MISMATCH)  
     notify\_agencies(\[IT\_DEPT, ED\])

Rule 3 — Public Official Wealth Surge

IF (node\_type IN \[PUBLIC\_OFFICIAL, POLITICIAN, GOVT\_EMPLOYEE\])  
AND (net\_worth\_growth\_percentage\_3yr \> 300%)  
THEN raise\_flag(RED, SUDDEN\_WEALTH\_GAIN)  
     push\_to\_public\_dashboard()  
     notify\_agencies(\[IT\_DEPT, LOKPAL\])

Rule 4 — Benami Suspicion

IF (properties\_in\_family\_members\_names \> 3\)  
AND (family\_members\_declared\_income\_combined \< total\_property\_value \* 0.2)  
THEN raise\_flag(ORANGE, BENAMI\_SUSPICION)  
     notify\_agencies(\[IT\_DEPT\])

Rule 5 — Shell Company Link

IF (business\_ownership\_records\_count \> 5\)  
AND (any\_company\_status \== DORMANT OR STRUCK\_OFF)  
AND (company\_turnover\_combined \< personal\_lifestyle\_expenditure)  
THEN raise\_flag(ORANGE, SHELL\_COMPANY\_LINK)

**Outputs:** Creates AnomalyFlag record, updates citizen node anomaly\_flag\_status, sends notification to relevant agencies, updates public dashboard for public officials.

---

### **Contract 2 — PROPERTY\_TRANSFER\_VALIDATOR**

**Trigger:** Runs when a new property registration is submitted.

**Validations:**

* Seller must be current owner on BSC (prevents double-selling)  
* Declared transaction value must be \>= 80% of circle rate (prevents extreme undervaluation)  
* No existing court stay order on the property  
* Seller's identity node must be active and not frozen

**On Success:** Transfers ownership in PropertyRecord, creates new blockchain transaction, updates both seller and buyer nodes.

**On Failure:** Rejects transaction, flags the specific violation, notifies relevant authority.

---

### **Contract 3 — ACCESS\_PERMISSION\_ENFORCER**

**Trigger:** Runs on every API request for citizen data.

**Logic:**

CITIZEN requesting own data         → ALLOW all fields  
IT\_DEPT with investigation number   → ALLOW income \+ asset summary  
IT\_DEPT without investigation       → ALLOW only anomaly flag status  
BANK with consent token             → ALLOW credit score only  
COURT with valid order number       → ALLOW full disclosure  
PUBLIC request for politician       → ALLOW asset categories \+ totals only  
PUBLIC request for citizen          → DENY all individual data  
ADMIN                               → ALLOW system metadata only, no personal data

Every access, whether allowed or denied, writes to AccessLog.

---

### **Contract 4 — ZKP\_VERIFIER**

**Purpose:** Allows agencies to verify facts about wealth without seeing raw data.

**Supported Queries:**

* "Does this citizen's net worth exceed \[threshold\]?" → Returns YES/NO  
* "Has this citizen's wealth grown by more than \[X\]% in \[Y\] years?" → Returns YES/NO  
* "Does this citizen own property in \[state\]?" → Returns YES/NO  
* "Is this citizen's declared income consistent with their asset holdings?" → Returns CONSISTENT/INCONSISTENT

**Implementation:** Uses simplified ZKP demonstration in prototype (full cryptographic ZKP in production).

---

## **7\. API Specifications**

All APIs are RESTful, return JSON, require JWT authentication, and every call is logged.

### **7.1 Identity APIs**

**POST /api/v1/identity/register** Creates a new citizen identity node. Request body: aadhaar\_hash, pan\_hash, node\_type, kyc\_level Response: node\_id, wallet\_address, created\_at Access: Admin only

**GET /api/v1/identity/{node\_id}** Returns citizen node details. Response: Full CitizenNode object filtered by caller's permission level Access: Citizen (own), IT Officer (summary), Admin (full)

**GET /api/v1/identity/{node\_id}/summary** Returns a non-sensitive summary for credit/verification purposes. Response: kyc\_level, anomaly\_flag\_status, node\_type, last\_verified Access: Banks (with consent token), Courts

---

### **7.2 Property APIs**

**POST /api/v1/property/register** Registers a new property on BSC. Request body: All PropertyRecord fields except blockchain\_tx\_hash (generated by system) Response: property\_id, blockchain\_tx\_hash, status Access: State registration offices (authorized nodes only)

**POST /api/v1/property/transfer** Transfers ownership. Triggers PROPERTY\_TRANSFER\_VALIDATOR contract. Request body: property\_id, new\_owner\_node\_id, transaction\_value, transfer\_type, document\_hash Response: new\_blockchain\_tx\_hash, transfer\_status, validation\_result Access: State registration offices

**GET /api/v1/property/{property\_id}** Returns full property record. Response: PropertyRecord object Access: Owner, IT Officer, Court

**GET /api/v1/property/by-citizen/{node\_id}** Returns all properties linked to a citizen. Response: Array of PropertyRecord objects Access: Citizen (own), IT Officer (with investigation number), Court

---

### **7.3 Financial Asset APIs**

**POST /api/v1/financial/report** Banks, SEBI entities report financial holdings for a citizen. Request body: owner\_node\_id, asset\_type, balance\_range, institution\_code, as\_of\_date Response: asset\_id, status Access: Authorized financial institutions only

**GET /api/v1/financial/by-citizen/{node\_id}** Returns all financial assets for a citizen. Response: Array of FinancialAsset objects (exact amounts masked for most callers) Access: Citizen (own with full detail), IT Officer (with investigation number), Court (full)

---

### **7.4 Anomaly APIs**

**GET /api/v1/anomaly/flags/active** Returns all currently active anomaly flags. Response: Array of AnomalyFlag objects with citizen summary Access: IT Officer, ED, CBI, Lokpal

**GET /api/v1/anomaly/flags/by-citizen/{node\_id}** Returns all flags for a specific citizen. Response: Array of AnomalyFlag objects Access: Citizen (own), IT Officer, Court

**POST /api/v1/anomaly/flags/{flag\_id}/resolve** Updates flag resolution status. Request body: current\_status, resolution\_notes Response: updated flag object Access: IT Officer (assigned cases only)

**POST /api/v1/anomaly/run-check/{node\_id}** Manually triggers smart contract anomaly check for a citizen. Response: check\_result, flags\_raised Access: IT Officer with investigation number

---

### **7.5 Public Dashboard APIs**

These APIs return data that is publicly visible — only for politicians and public officials.

**GET /api/v1/public/officials** Returns list of all registered public officials with basic asset summary. Response: Array of {node\_id, name (if consented), node\_type, total\_property\_count, asset\_category, anomaly\_flag\_status, wealth\_declared\_year} Access: Public (no authentication required)

**GET /api/v1/public/officials/{node\_id}/timeline** Returns wealth growth timeline for a public official across years. Response: Array of {year, total\_property\_value\_range, total\_financial\_asset\_range, anomaly\_count} Access: Public

**GET /api/v1/public/statistics** Returns aggregate national statistics — no individual data. Response: {total\_registered\_nodes, total\_properties\_on\_chain, total\_flagged\_cases, total\_resolved\_cases, tax\_recovery\_estimate} Access: Public

---

### **7.6 ZKP Verification APIs**

**POST /api/v1/zkp/verify** Submits a ZKP query about a citizen without accessing raw data. Request body: node\_id, query\_type, threshold\_value, requester\_id, purpose Response: {result: "YES"/"NO"/"CONSISTENT"/"INCONSISTENT", proof\_hash, verified\_at} Access: Banks, Government agencies, Courts

---

### **7.7 Audit APIs**

**GET /api/v1/audit/logs/by-citizen/{node\_id}** Returns all access logs for a citizen's data. Response: Array of AccessLog objects Access: Citizen (own), Admin, Court

**GET /api/v1/audit/logs/by-officer/{officer\_id}** Returns all data accesses made by a specific officer. Response: Array of AccessLog objects Access: Admin, Anti-corruption authority

---

## **8\. User Interface Requirements**

### **8.1 Citizen Dashboard**

**Screen 1 — Home / Wealth Overview** Shows the citizen their own complete asset picture.

Elements needed:

* Total estimated net worth (shown as range, e.g. "₹50 lakh – ₹1 crore")  
* Asset breakdown donut chart — property vs financial vs business vs other  
* Anomaly flag status (green \= clear, yellow \= soft flag, red \= serious flag)  
* Last verified date  
* Quick stats: number of properties, number of bank accounts linked, number of investments

**Screen 2 — My Properties** Shows all property records linked to the citizen's node.

Elements needed:

* List of all properties with address, type, area, declared value, current status  
* Each property shows chain of ownership history  
* Map view showing property locations (using OpenStreetMap)  
* Filter by state, property type, status  
* Each property card shows: registration date, declared value, circle rate value, gap percentage

**Screen 3 — My Financial Assets** Shows all financial holdings.

Elements needed:

* Grouped list by asset type (bank accounts, investments, provident fund, etc.)  
* Each entry shows institution, asset type, balance range, last synced date  
* Total financial wealth range  
* Assets not yet linked to BSC (with prompt to link)

**Screen 4 — Data Access Log** Shows every time government or any agency accessed the citizen's data.

Elements needed:

* Chronological list of all access events  
* Each entry shows: who accessed, which agency, which data fields, what purpose, what date  
* Alert if any unauthorized access detected  
* Option to raise a complaint against suspicious access

**Screen 5 — My Anomaly Flags** Shows any flags raised by smart contracts against the citizen.

Elements needed:

* Current flag status with severity color coding  
* Explanation of why the flag was raised (plain language, not legal jargon)  
* What data triggered the flag  
* What the citizen needs to do (upload explanation, provide documents)  
* Status of resolution

---

### **8.2 Public Official Transparency Dashboard**

This is publicly accessible without login.

**Screen 1 — Browse Officials** Elements needed:

* Searchable, filterable list of all registered politicians and public officials  
* Filters: state, position, party, year elected  
* Each card shows: name, position, node\_type, flag status, declared wealth range, trend arrow (wealth growing/stable)  
* Sort by: wealth, wealth growth %, number of flags, last updated

**Screen 2 — Official Profile** Elements needed:

* Name, position, constituency, years in office  
* Asset timeline chart — bar chart showing total declared wealth by year  
* Property count by year  
* Anomaly flag history  
* Asset categories (shown as pie chart — no exact amounts)  
* Source transparency note — "data sourced from: Election Commission affidavits, BSC property registry, BSC financial layer"  
* Comparison with average civil servant salary for their grade

**Screen 3 — Compare Officials** Elements needed:

* Side by side comparison of up to 3 officials  
* Wealth growth rate comparison  
* Property count comparison  
* Flag history comparison

---

### **8.3 IT Officer Investigation Console**

**Screen 1 — Active Flags Dashboard** Elements needed:

* Priority queue of all open anomaly flags sorted by severity  
* Quick stats: total open RED flags, total open YELLOW flags, cases assigned to me, cases resolved this month  
* Filter by: flag type, severity, state, assigned officer, date range  
* Each flag card shows: citizen summary (masked), flag type, gap amount, date raised, days open

**Screen 2 — Case Investigation View** Elements needed:

* Full citizen asset profile (visible after entering valid investigation number)  
* Income vs asset comparison chart (visual gap analysis)  
* Timeline of asset acquisitions vs income declarations  
* All smart contract rules that triggered on this case  
* Document viewer (registration documents, ITR scans from system)  
* Action panel: request more information, escalate to ED/CBI, clear flag, file note

**Screen 3 — Cross-Family Analysis** Elements needed:

* Shows the citizen's node alongside family member nodes (spouse, children, parents)  
* Combined family wealth vs combined declared income  
* Benami risk score  
* Network graph showing property ownership links across family

---

### **8.4 Admin Panel**

**Screen 1 — System Health** Elements needed:

* Blockchain node status (all nodes up/down)  
* Transaction throughput (records written per minute)  
* Smart contract execution queue  
* API response times  
* Data freshness indicators by agency

**Screen 2 — Agency Management** Elements needed:

* List of all authorized agencies with their permission levels  
* Enable/disable agency access  
* Audit agency access patterns  
* Manage agency cryptographic keys

**Screen 3 — Audit Overview** Elements needed:

* Total access events today/week/month  
* Access by agency breakdown  
* Suspicious access pattern alerts  
* Export audit report

---

## **9\. Non-Functional Requirements**

**Performance:**

* API response time \< 500ms for dashboard queries  
* Blockchain write confirmation \< 10 seconds  
* Smart contract execution \< 30 seconds per citizen node  
* Dashboard page load \< 2 seconds  
* Support 10,000 concurrent users in prototype, designed to scale to 10 million

**Security:**

* All data encrypted at rest (AES-256)  
* All API communication over TLS 1.3 only  
* JWT tokens expire in 30 minutes; refresh tokens expire in 24 hours  
* Rate limiting: 100 requests per minute per authenticated user, 10 per minute for public endpoints  
* Every failed authentication attempt logged and alerted after 5 consecutive failures  
* No raw Aadhaar or PAN numbers stored anywhere in the system — only hashed versions

**Privacy:**

* Exact financial balances never stored — only ranges  
* ZKP used for verification queries wherever possible  
* Citizen notified within 1 hour of any government agency accessing their data  
* Data minimization — each role receives only the minimum fields needed  
* Right to know — citizen can always see the full audit trail of who accessed their data

**Reliability:**

* 99.5% uptime target for prototype  
* Blockchain data is permanent and cannot be lost  
* Daily backup of off-chain database components  
* Graceful degradation — if blockchain layer is slow, dashboards show cached data with staleness indicator

**Compliance:**

* Aligned with Digital Personal Data Protection Act 2023  
* Aligned with IT Act 2000 and amendments  
* Designed to meet future BSC Act requirements (as described in whitepaper)

---

## **10\. Prototype Technology Choices**

**Blockchain:** Hyperledger Fabric 2.5 running on a local testnet with 3 peer nodes. This is the right choice for a government permissioned blockchain where you need control over who can write and read.

**Smart Contracts:** Written in Go using Hyperledger Chaincode. Go is the best supported language for Hyperledger and produces fast, reliable contracts.

**Backend API:** Node.js with Express. Hyperledger Fabric has the best SDK support in Node.js. Use TypeScript for type safety.

**Database:** PostgreSQL for off-chain indexing (searching and filtering is much faster off-chain), with all writes going to blockchain first and then indexed. Redis for caching and session management.

**Document Storage:** IPFS for storing registration documents and supporting files. Only the IPFS hash is stored on blockchain.

**Frontend:** React.js with TailwindCSS. Three separate frontend applications — Citizen Dashboard, Public Dashboard, Officer Console — sharing a common component library.

**ZKP (Prototype):** snarkjs \+ circom for the ZKP demonstration module. In prototype this will be a simplified demonstration; production would use StarkNet or zkSync.

**Authentication:** JWT-based with role claims. Biometric simulation in prototype (button click to "verify biometric").

**Deployment:** Docker Compose for local development. All services containerized. README with single-command setup.

---

## **11\. Seed Data for Prototype**

The prototype needs realistic seed data to demonstrate value. Build the following:

**50 Citizen Nodes** across different profiles:

* 10 ordinary middle-class citizens (no flags, modest assets)  
* 10 high-net-worth individuals (clean, legitimate wealth)  
* 10 public officials (mixed — some clean, some flagged)  
* 10 politicians (several with RED flags, wealth disproportionate to salary)  
* 5 suspected benami cases (multiple family members with suspiciously linked properties)  
* 5 shell company cases (many business ownerships, low declared income)

**200 Property Records** linked to the above citizens, using realistic Indian addresses, survey numbers, values.

**300 Financial Asset Records** across banks, mutual funds, EPF, with realistic balance ranges.

**30 Anomaly Flags** — mix of YELLOW, ORANGE, RED, at different resolution stages.

**100 Access Log Entries** showing various agencies accessing data for various purposes.

---

## **12\. Success Criteria for Prototype**

The prototype is successful when:

1. A journalist or activist can open the public dashboard and find a politician's 5-year wealth growth chart within 2 minutes — without logging in.

2. A simulated IT officer can open an investigation console, find a RED-flagged case, see the income vs asset gap clearly visualized, and take an action on it — within 5 minutes.

3. A citizen can log in, see all their linked assets, and see a complete log of every time any government body accessed their data — within 2 minutes.

4. A new property registration triggers the smart contract, runs all anomaly rules, and either clears the transaction or raises a flag — in under 30 seconds.

5. A ZKP query can answer "does this citizen's net worth exceed ₹1 crore?" — returning only YES or NO — without any officer ever seeing the actual balance.

6. Any technical reviewer from IIT, NASSCOM, or a civil society organization can read the GitHub repository, understand the architecture, run it locally in under 30 minutes, and confirm the concept is sound.

---

## **13\. Open Source & Community Strategy**

The prototype must be fully open source from day one. This is not just a technical choice — it is a political and trust strategy.

**Repository structure:**

* Main repo: BharatSampadaChain on GitHub  
* LICENSE: MIT (maximum permissive, government can adopt freely)  
* README: Single-command Docker setup, clear architecture diagram, contribution guide  
* WHITEPAPER.md: Full concept document  
* ROADMAP.md: Path from prototype to production

**Why open source matters here:** A transparency system that is itself opaque would be hypocritical and would fail to win public trust. Every line of code must be publicly auditable. This also prevents any single entity — including the original builders — from controlling or corrupting the system.

---

## **14\. What This PRD Does NOT Cover**

These are real requirements for production but out of scope for prototype:

* Real Aadhaar/UIDAI API integration  
* Live RBI/bank data feeds  
* Production cryptographic security audit  
* Legal compliance certification  
* Load testing at national scale  
* Disaster recovery planning  
* Multi-language support (Hindi, regional languages)  
* Accessibility compliance  
* Mobile application  
* Offline functionality for rural areas

Each of these becomes a separate PRD when moving from prototype to production.

---

## **15\. Summary**

Build this prototype in this order:

First, set up the Hyperledger Fabric blockchain testnet with the four smart contracts defined above. Get writes and reads working. This is your foundation — everything else depends on it.

Second, build the data models and PostgreSQL schema. Write the seeder to generate all 50 citizen nodes and linked records.

Third, build the API gateway with all endpoints defined in Section 7\. Test every endpoint with Postman before touching any UI.

Fourth, build the three frontends in this order — Public Dashboard first (simplest, no auth, highest impact for demonstrations), then Citizen Dashboard, then Officer Console.

Fifth, build the ZKP demonstration module and connect it to the verification API.

Sixth, write the README and make sure someone with no context can run the entire system locally in 30 minutes.

Then share it. Every line of code is an argument that cannot be ignored.

---

*Bharat Sampada Chain — Built by Citizens, For Citizens. Jai Hind.*

