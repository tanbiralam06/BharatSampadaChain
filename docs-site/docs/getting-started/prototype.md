---
id: prototype
title: Run the Prototype
sidebar_label: Run the Prototype
---

# Run the Prototype

The prototype runs entirely in your browser with no setup required — no blockchain, no Docker, no API keys.

It uses realistic dummy data to demonstrate every feature of BSC: public wealth browsing, citizen data access logs, officer investigation workflows, and the admin panel.

---

## Prerequisites

- **Git** installed
- **Node.js v18+** — check with `node -v`
- **npm** — bundled with Node.js

---

## Steps

```bash
git clone https://github.com/tanbiralam06/BharatSampadaChain.git
cd bsc/bsc-prototype
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Select any of the four roles from the landing screen to explore the system.

:::info No blockchain required
The prototype uses hardcoded dummy data. No Fabric network, no PostgreSQL, no Redis. It is a pure frontend demonstration.
:::

---

## What You Can Explore

### Public Dashboard (no login)

- Browse all registered politicians and officials
- View 5-year declared wealth growth timeline for any official
- Compare wealth trajectories of up to 3 officials side by side
- See national anomaly statistics

### Citizen Dashboard

Use Aadhaar `123456789012` to log in.

- View complete asset profile — properties, financial assets, business stakes
- See net worth range (privacy-preserving)
- Track every government agency access to your data with timestamps and purpose
- Read any anomaly flags in plain language

### Officer Investigation Console

Use email `rajesh.kumar@itdept.bsc.gov` to log in.

- Priority queue of anomaly flags sorted by severity (RED → ORANGE → YELLOW)
- Full investigation view: income vs. asset gap chart, acquisition timeline
- Cross-family benami network analysis
- Action panel: escalate, clear, add notes

### Admin Panel

Use username `admin` to log in.

- Real-time blockchain node health
- Live transaction feed
- Agency management
- Audit overview

All passwords in the prototype are `password`.

---

## Next Steps

Once you have explored the prototype:

- **Deploy the full stack** → [Full Stack with Docker](./full-stack)
- **Understand the architecture** → [System Overview](../architecture/system-overview)
- **Call the API directly** → [API Reference](../api-reference/introduction)
