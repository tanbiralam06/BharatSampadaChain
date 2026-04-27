---
id: dev-setup
title: Development Setup
sidebar_label: Development Setup
---

# Development Setup

For active development — hot-reload API, live-reload frontends, optional Fabric network.

---

## Prerequisites

- **Node.js v20+** (`node -v`)
- **Go 1.22+** (`go version`) — only needed if modifying chaincode
- **Docker Desktop** — for PostgreSQL, Redis, and optionally Fabric
- **Git**

---

## Step 1 — Clone and Configure

```bash
git clone https://github.com/tanbiralam06/BharatSampadaChain.git
cd bsc
cp .env.example .env
```

Edit `.env` — the only field you must change for local dev is `FABRIC_CRYPTO_PATH`:
```env
FABRIC_CRYPTO_PATH=/absolute/path/to/bsc/blockchain/network/crypto-config
```

---

## Step 2 — Start Databases

```bash
docker compose -f docker/docker-compose.yml --project-name bsc up -d postgres redis
```

Verify:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## Step 3 — Apply Migrations

```bash
make seed
```

This runs all SQL migrations in `database/migrations/` in order and seeds 10 test citizens.

---

## Step 4 — Start the API (hot reload)

```bash
cd api
npm install
npm run dev
```

Wait for: `BSC API running on port 4000`

The API uses `ts-node-dev` — it reloads automatically on file saves.

---

## Step 5 — Start Frontends

```bash
cd frontend
npm install

# Open a separate terminal for each app you need:
npm run dev:public    # → http://localhost:5173
npm run dev:citizen   # → http://localhost:5174
npm run dev:officer   # → http://localhost:5175
npm run dev:admin     # → http://localhost:5176
```

You only need to start apps you are actively working on.

---

## Step 6 (Optional) — Start Hyperledger Fabric

The API degrades gracefully if Fabric is not running — read/write endpoints return errors, but auth and PostgreSQL-backed endpoints still work.

To start Fabric:
```bash
docker compose -f docker/docker-compose.yml --project-name bsc up -d
bash blockchain/scripts/deploy-chaincode.sh
```

---

## Running Tests

```bash
# API tests (Jest + Supertest — mocked Fabric, real PostgreSQL)
cd api && npm test

# API tests with coverage report
cd api && npm test -- --coverage

# Go chaincode tests
cd blockchain/chaincode/anomaly && go test ./...
cd blockchain/chaincode/property && go test ./...

# Frontend type check
cd frontend && npm run typecheck
```

---

## Daily Startup Cheat Sheet

```bash
# 1. Start databases
docker compose -f docker/docker-compose.yml --project-name bsc up -d postgres redis

# 2. Start API (hot reload)
cd api && npm run dev

# 3. Start whichever frontend you need
cd frontend && npm run dev:officer    # or :admin / :citizen / :public

# Stop at end of day (preserves data)
docker compose -f docker/docker-compose.yml --project-name bsc stop
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `AggregateError` in API logs | PostgreSQL not ready | Wait 5s, Ctrl+C, re-run `npm run dev` |
| `Invalid credentials` | Migration not applied | Run `make seed` |
| Frontend blank page | API not running | Start `npm run dev` in `api/` first |
| Port already in use | Previous process alive | `npx kill-port 4000` (or 5173–5176) |
| Docker containers not found | Docker Desktop not started | Open Docker Desktop |
