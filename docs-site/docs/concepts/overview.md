---
id: overview
title: The Problem BSC Solves
sidebar_label: Overview & The Problem
---

# The Problem BSC Solves

## India's Black Economy Lives in Plain Sight

India's wealth opacity is not hidden under mattresses. It is hidden in undervalued property registrations, in shell companies with zero declared turnover, in family members' names holding assets far beyond their income, and in foreign accounts no domestic regulator sees.

The numbers:
- **₹7–10 lakh crore** — estimated annual revenue loss to tax evasion
- **₹1.3 lakh crore** — value of benami properties identified since 2016
- **₹3 lakh crore** — estimated welfare subsidy leakage annually
- **30–180 days** — time for a manual cross-agency investigation

None of these problems require new laws to address. Most of them require only that existing data be **connected**.

---

## The Silo Problem

India already collects the data needed to detect most wealth anomalies. The challenge is that this data lives in five separate systems that do not talk to each other:

| System | Knows | Does Not Know |
|---|---|---|
| UIDAI (Aadhaar) | Who a person is — biometric identity for 1.3B citizens | What they own |
| IT Dept (ITR Portal) | Declared income each year | Market value of their property portfolio |
| State Land Registries (28 systems) | What property exists and who registered it | The registrant's income profile |
| MCA21 | Company directors and filed turnover | When a director's lifestyle exceeds their company's revenue |
| Banking System | Account balances and high-value transactions | Connection to property or business structures |

Each system is doing its job correctly within its own boundary. The problem is architectural. There is no layer that connects them.

**BSC is that layer.**

---

## Why Manual Cross-Reference Fails

An IT officer investigating a suspected benami case today must:

1. File an internal request for ITR data — 3 to 10 days
2. File a separate request to the state land registry — 5 to 15 days
3. File a separate request to MCA21 — 3 to 7 days
4. Subpoena bank records through a formal legal process — 30 to 90 days
5. Manually correlate across four different file formats with no shared identifier

By the time the officer has assembled the complete picture, the assets may have been transferred. The process is not just slow — it is structurally designed for failure.

---

## What BSC Adds

BSC does not replace any of the five systems above. It adds a connection layer on top of them.

When a property is registered in state X, BSC receives that record and links it to the owner's identity node. When that owner files their ITR, BSC links the income declaration to the same node. When the gap between declared income and actual property holdings exceeds a threshold, a smart contract raises a flag — automatically, without any human deciding to investigate.

The math decides. Not a person.

---

## BSC Is Not Surveillance

This is the most important point in this document.

BSC is equally useful to:
- the **honest citizen** who wants to know which government agencies have been looking at their records
- the **investigative journalist** tracking a politician's ₹45 crore net worth on a ₹1.5 lakh monthly salary
- the **IT officer** who currently spends 30–180 days assembling the same data BSC shows in minutes

Every access to a citizen's data is logged on the immutable blockchain with the officer's identity, the purpose, and the investigation case reference. Citizens can see this log. A government that claims to use BSC for transparency while secretly using it for political targeting would expose itself through the very audit trail the system creates.

A transparency system that is itself opaque would be a contradiction. BSC does not accept that contradiction.

---

## Next Steps

- Understand how citizen identity is structured: [Identity Model](./identity-model)
- See how anomaly detection works: [Anomaly Detection](./anomaly-detection)
- Read the full technical rationale: [Whitepaper](../whitepaper/index)
