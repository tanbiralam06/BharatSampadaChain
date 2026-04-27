---
id: seed-data
title: Seeding Development Data
sidebar_label: Seeding Data
---

# Seeding Development Data

The `make seed` command applies all database migrations and loads 10 test citizens across 8 Indian states.

---

## Run Seeds

```bash
make seed
```

This runs all SQL files in `database/migrations/` in alphabetical order using the `bsc-postgres` container.

:::note
`make seed` requires the `bsc-postgres` container to be running. Start it first with:
```bash
docker compose -f docker/docker-compose.yml --project-name bsc up -d postgres
```
:::

---

## What Gets Seeded

### Citizens (10 records)

Located in `database/migrations/002_seed_data.sql`. Mix of:
- civilians, government officials, politicians
- declared asset ranges from ₹8L to ₹120 crore
- pre-existing anomaly flags at all severity levels
- properties across Mumbai, Delhi, Hyderabad, Chennai, Kolkata

### System Officers (3 records)

| Name | Email | Role |
|---|---|---|
| Admin (BSC) | `admin` | ADMIN |
| Rajesh Kumar | `rajesh.kumar@itdept.bsc.gov` | IT_DEPT |
| Priya Sharma | `priya.sharma@cbi.gov.in` | CBI |

### Court and Bank Officers (from migration 006)

| Name | Email | Role |
|---|---|---|
| Justice Meera Sharma | `judge.sharma@hc.gov.in` | COURT |
| SBI Compliance Officer | `compliance@sbi.co.in` | BANK |

Apply migration 006 separately if not using `make seed`:
```bash
docker exec -i bsc-postgres psql -U bsc -d bsc_db < database/migrations/006_court_bank_users.sql
```

---

## All Seed Passwords

All seed accounts use password: `password`

:::danger
Change all passwords before any demo or production deployment.
:::

---

## Resetting Seed Data

To wipe the database and re-seed from scratch:

```bash
make reset   # destroys Docker volumes
make seed    # re-applies migrations and seed data
```

This also destroys the Fabric ledger. All on-chain data will be lost.
