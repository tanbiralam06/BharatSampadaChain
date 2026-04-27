---
id: full-stack
title: Full Stack with Docker
sidebar_label: Full Stack with Docker
---

# Full Stack with Docker

This option runs the complete BSC system: Hyperledger Fabric blockchain, API gateway, PostgreSQL, Redis, and all four frontend apps — all in Docker containers.

:::warning System Requirements
- **RAM:** 8 GB minimum, 16 GB recommended
- **CPU:** 4 cores minimum
- **Disk:** 10 GB free (Docker images + ledger data)
- **Docker Desktop** installed and running
:::

---

## First-Time Setup

```bash
git clone https://github.com/BharatSampadaChain/bsc.git
cd bsc

# 1. Copy environment configuration
cp .env.example .env

# 2. Start all containers (builds API image, pulls Fabric images — takes ~10 min first time)
docker compose -f docker/docker-compose.yml --project-name bsc up -d --build

# 3. Deploy all 4 chaincodes to the Fabric channel (idempotent — safe to re-run)
bash blockchain/scripts/deploy-chaincode.sh

# 4. Run database migrations and seed data
make seed
```

Then start the frontend apps:

```bash
cd frontend
npm install

# Each in its own terminal:
npm run dev:admin      # → http://localhost:5176
npm run dev:officer    # → http://localhost:5175
npm run dev:citizen    # → http://localhost:5174
npm run dev:public     # → http://localhost:5173
```

---

## Subsequent Restarts

Data lives in Docker volumes and survives restarts:

```bash
# Start all containers
docker compose -f docker/docker-compose.yml --project-name bsc up -d

# Start frontends
cd frontend && npm run dev:admin   # (and others as needed)
```

---

## Rebuilding After Code Changes

```bash
# Rebuild the API image after editing api/src/
docker compose -f docker/docker-compose.yml --project-name bsc up -d --build api
```

---

## Verify Everything is Running

```bash
# API health check
curl http://localhost:4000/health

# Check all container statuses
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Expected containers: `bsc-orderer`, `bsc-peer0-itdept`, `bsc-peer0-registrar`, `bsc-peer0-mca`, `bsc-cli`, `bsc-postgres`, `bsc-redis`, `bsc-api`

---

## Default Credentials

See [DEV_CREDENTIALS.md](https://github.com/BharatSampadaChain/bsc/blob/main/DEV_CREDENTIALS.md) for all seed accounts. All passwords are `password`.

| App | URL | Login |
|---|---|---|
| Admin Panel | http://localhost:5176 | `admin` / `password` |
| Officer Console | http://localhost:5175 | `rajesh.kumar@itdept.bsc.gov` / `password` |
| Citizen Dashboard | http://localhost:5174 | Aadhaar `123456789012` / `password` |
| Public Dashboard | http://localhost:5173 | No login required |
| API | http://localhost:4000 | JWT — see below |

```bash
# Get a JWT token
curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"rajesh.kumar@itdept.bsc.gov","password":"password","role":"IT_DEPT"}' \
  | jq -r '.data.token'
```

---

## Stopping

```bash
# Stop containers, preserve all data
docker compose -f docker/docker-compose.yml --project-name bsc stop

# Full reset — destroys all ledger data and migrations
make reset
```

:::danger make reset
This wipes the blockchain ledger, PostgreSQL database, and Redis cache. All test data will be lost.
:::
