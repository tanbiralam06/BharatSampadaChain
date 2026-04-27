---
id: intro
title: What is BSC?
sidebar_label: What is BSC?
slug: /intro
---

# Bharat Sampada Chain (BSC)

> **India loses ₹7–10 lakh crore every year to tax evasion, benami property, and welfare fraud.**
> Not because the data does not exist — but because nobody connects it.
> **BSC connects it.**

---

## The One-Paragraph Pitch

Bharat Sampada Chain is a permissioned blockchain system that links every Indian citizen's property records, land holdings, financial assets, and business ownership to a single cryptographically verifiable identity node.

When a property is registered, BSC writes it to the ledger. When an ITR is filed, BSC links it to the same identity. When the gap between what someone declared and what they own becomes suspicious, a smart contract raises a flag — automatically, without human discretion, without political interference.

BSC makes wealth opacity structurally difficult. Not through more laws. Through connected data.

**It is fully open source. Every line of code is publicly auditable. A transparency system that is itself opaque would be a contradiction.**

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

## The Four Dashboards

BSC has four role-based interfaces. Each role sees only what it is permitted to see — enforced by smart contract, not policy.

### Public Dashboard — No Login Required
*For journalists, activists, researchers, and ordinary citizens*

Browse all registered politicians and public officials, view 5-year declared wealth growth timelines, and compare wealth trajectories side by side. No account required.

### Citizen Dashboard — Aadhaar Login
*For every registered Indian citizen*

View your complete asset profile. Track every time any government agency accessed your data — who, when, what fields, what purpose. Understand any anomaly flags raised against you in plain language.

### Officer Investigation Console
*For Income Tax Department, ED, CBI, Lokpal investigators*

Priority queue of all active anomaly flags. Full case investigation view: income vs. asset gap chart, acquisition timeline, cross-family benami analysis. Every access logged immutably.

### Admin Panel — BSC Authority Only
*For system administrators managing the national infrastructure*

Real-time blockchain node health, live transaction feed, agency management, and full audit overview.

---

## What BSC Is Not

BSC is not a surveillance system. Citizens can see exactly who accessed their data and why. Every access requires a logged investigation reference. The system is designed to be equally useful to:

- the honest citizen who wants to know who looked at their records
- the journalist tracking a politician's unexplained ₹45 crore net worth on a ₹1.5 lakh salary
- the IT officer trying to build a case without querying six disconnected databases

---

## Quick Navigation

| I want to... | Go to |
|---|---|
| Run the prototype in 60 seconds | [Getting Started → Prototype](./getting-started/prototype) |
| Deploy the full stack with Docker | [Getting Started → Full Stack](./getting-started/full-stack) |
| Understand the architecture | [Architecture → System Overview](./architecture/system-overview) |
| Call the API | [API Reference](./api-reference/introduction) |
| Deploy for my own country/state | [Adapt BSC](./adaptation/index) |
| Read the technical whitepaper | [Whitepaper](./whitepaper/index) |
