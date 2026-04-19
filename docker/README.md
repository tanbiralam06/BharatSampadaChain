# docker/

Docker Compose files for running the full BSC stack locally.

## Files

| File | Use When |
|---|---|
| `docker-compose.yml` | Base configuration — all services defined here |
| `docker-compose.dev.yml` | Development overrides — volume mounts for hot reload, debug ports |
| `docker-compose.prod.yml` | Production overrides — no debug, resource limits, health checks |

## Services Defined

| Service | Image | Port | Purpose |
|---|---|---|---|
| `peer0.itdept` | hyperledger/fabric-peer | 7051 | Fabric peer — IT Department |
| `peer0.registrar` | hyperledger/fabric-peer | 8051 | Fabric peer — Property Registrar |
| `peer0.mca` | hyperledger/fabric-peer | 9051 | Fabric peer — MCA |
| `orderer` | hyperledger/fabric-orderer | 7050 | Fabric orderer |
| `couchdb0` | couchdb:3.3 | 5984 | State DB for peer0.itdept |
| `couchdb1` | couchdb:3.3 | 6984 | State DB for peer0.registrar |
| `couchdb2` | couchdb:3.3 | 7984 | State DB for peer0.mca |
| `postgres` | postgres:15 | 5432 | Off-chain index database |
| `redis` | redis:7 | 6379 | Session cache + API response cache |
| `api` | bsc/api | 4000 | Node.js API gateway |
| `public-dashboard` | bsc/public | 3000 | Public React app |
| `citizen-dashboard` | bsc/citizen | 3001 | Citizen React app |
| `officer-console` | bsc/officer | 3002 | Officer React app |
| `admin-panel` | bsc/admin | 3003 | Admin React app |

## Quick Start

```bash
# From the repository root:
docker compose up --build

# Development (with hot reload):
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up

# Stop everything:
docker compose down

# Stop and wipe all data (full reset):
docker compose down -v
```

## First-Time Setup

The first `docker compose up` will:
1. Build all Docker images
2. Start the Fabric network
3. Generate crypto material
4. Create the channel
5. Deploy all chaincode
6. Start PostgreSQL and run migrations
7. Start the API and frontends

**This takes 3–5 minutes on first run.** Subsequent starts are under 30 seconds.

## Resource Requirements

- RAM: 16 GB minimum (Fabric peers are memory-intensive)
- Disk: 50 GB free space
- CPU: 4 cores recommended
