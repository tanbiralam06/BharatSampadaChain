---
id: run-prototype
title: Prototype Walkthrough
sidebar_label: Prototype Walkthrough
---

# Prototype Walkthrough

The prototype is a standalone React app with realistic dummy data. Use it to understand all BSC features before deploying the full stack.

---

## Start It

```bash
git clone https://github.com/BharatSampadaChain/bsc.git
cd bsc/bsc-prototype
npm install && npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Exploring the Four Roles

### Public Dashboard (no login)

Click "Public Dashboard" on the landing screen.

1. **Browse Officials** — see all registered politicians with their declared wealth, state, and anomaly score badge (RED/ORANGE/YELLOW/CLEAR)
2. **Official Profile** — click any official to see their 5-year wealth growth timeline, property holdings breakdown, and flag history
3. **Compare** — select 2–3 officials for a side-by-side trajectory comparison
4. **National Stats** — total flagged cases, estimated recoverable amount, state breakdown

### Citizen Dashboard

Login: Aadhaar `123456789012`, password `password`

1. **Overview** — net worth range, anomaly score, properties count
2. **Properties** — all registered properties with values and encumbrance status
3. **Financial** — declared financial assets by category
4. **Flags** — any anomaly flags with plain-language explanations
5. **Access Log** — every government agency that read your data, with timestamps and stated purpose

Try Aadhaar `234567890123` or `345678901234` for different citizen profiles.

### Officer Investigation Console

Login: `rajesh.kumar@itdept.bsc.gov`, password `password`

1. **Active Flags** — priority queue sorted by severity (RED first), with quick-filter by severity
2. **Investigate** — search any citizen by hash. See income vs. asset gap chart, acquisition timeline, benami network graph
3. **Family Analysis** — visualise wealth distribution across a citizen's family network
4. **My Team** — manage officers in your agency

Try `priya.sharma@cbi.gov.in` for the CBI perspective, or `judge.sharma@hc.gov.in` for Court Orders.

### Admin Panel

Login: username `admin`, password `password`

1. **System Health** — Fabric peer status, PostgreSQL and Redis health, API latency
2. **Agency Management** — enable/disable agency access
3. **Officer Management** — create officers, toggle active status, view by agency
4. **Audit Overview** — access patterns, weekly breakdown, suspicious behaviour alerts
5. **Security** — TOTP 2FA configuration
6. **Permission Matrix** — view and edit the role permission matrix

---

## Seed Data Summary

The prototype includes:
- 10 fictional citizens across 8 Indian states
- A mix of civilians, government officials, and politicians
- Pre-generated anomaly flags at all severity levels
- Sample property portfolios with transfer history
- Sample access log entries

---

## Limitations

The prototype is frontend-only:
- All data is hardcoded in the React components — no API calls
- Actions (run anomaly check, freeze property, submit flag) show success messages but do nothing
- No JWT auth — the prototype simulates login with local state

For real blockchain interaction, deploy the [Full Stack](../getting-started/full-stack).
