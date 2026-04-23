# BSC — Startup Guide (After Laptop Restart)

> Follow sections in order. Each section tells you when it's safe to move to the next one.

---

## Before You Start — Check STATUS.md

Open `STATUS.md` first to know which deployment phase you're in. The startup steps below differ depending on whether all 4 chaincodes are committed yet.

---

## Step 1 — Start Docker Desktop

1. Open **Docker Desktop** from the Start Menu
2. Wait until the bottom-left shows a **green whale icon** with "Docker Desktop is running"
3. This usually takes 30–60 seconds after login

> If Docker Desktop doesn't start automatically on boot, search "Docker Desktop" in the Start Menu and open it manually.

---

## Step 2 — Open WSL2 Terminal

Open **Windows Terminal** (or any terminal) and launch WSL2:

```
wsl
```

All commands from this point onwards run inside WSL2, not Windows CMD/PowerShell.

Verify Docker is accessible from WSL2:

```bash
docker ps
```

Expected output: a table header (even if no containers are running). If you get "Cannot connect to the Docker daemon", Docker Desktop is not ready yet — wait 15 more seconds and retry.

---

## Step 3 — Start the Fabric Network

```bash
cd /mnt/c/Users/alamt/Downloads/BSC
docker compose -f blockchain/network/docker-compose-fabric.yml --project-name bsc up -d
```

Wait 10 seconds, then verify all 5 containers are up:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

You should see all 5 running:

```
NAMES                       STATUS
bsc-cli                     Up X seconds
peer0.mca.bsc.gov           Up X seconds
peer0.registrar.bsc.gov     Up X seconds
peer0.itdept.bsc.gov        Up X seconds
orderer.bsc.gov             Up X seconds
```

> **If any container shows "Exited"**, check logs: `docker logs <container-name>`
> The most common cause is the genesis block or crypto files missing — see the Troubleshooting section at the bottom.

---

## Step 4 — Start PostgreSQL and Redis

```bash
cd /mnt/c/Users/alamt/Downloads/BSC
docker compose -f docker/docker-compose.yml --project-name bsc up -d postgres redis
```

Wait 10 seconds, then check they are healthy:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "postgres|redis"
```

Expected:
```
bsc-postgres    Up X seconds (healthy)
bsc-redis       Up X seconds (healthy)
```

> `(healthy)` appears after ~15 seconds. If it shows `(health: starting)`, wait a few more seconds and re-check.

---

## Step 5 — Verify the Blockchain Channel is Still Live

Quick sanity check — query a peer to confirm the channel is accessible:

```bash
docker exec \
  -e CORE_PEER_ADDRESS=peer0.itdept.bsc.gov:7051 \
  -e CORE_PEER_LOCALMSPID=ITDeptMSP \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/itdept.bsc.gov/users/Admin@itdept.bsc.gov/msp \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/itdept.bsc.gov/peers/peer0.itdept.bsc.gov/tls/ca.crt \
  bsc-cli peer channel list
```

Expected output:
```
Channels peers has joined:
bsc-channel
```

If you see `bsc-channel` — the network is healthy and all committed chaincodes are still live. The ledger state (data written to the blockchain) persists across restarts because Docker named volumes (`orderer.bsc.gov`, `peer0.itdept.bsc.gov`, etc.) are preserved.

---

## Step 6 — Start the API (Development Mode)

Open a **second WSL2 terminal tab** for this (keep the first one free for blockchain commands).

```bash
cd /mnt/c/Users/alamt/Downloads/BSC/api
```

If `.env` does not exist yet, create it:

```bash
cat > .env << 'EOF'
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://bsc:bsc_dev_password@localhost:5432/bsc_db
REDIS_URL=redis://:bsc_redis_dev@localhost:6379
JWT_SECRET=bsc_dev_secret_change_in_production_32chars
FABRIC_CHANNEL=bsc-channel
FABRIC_PEER_ENDPOINT=peer0.itdept.bsc.gov:7051
FABRIC_MSP_ID=ITDeptMSP
FABRIC_CRYPTO_PATH=/mnt/c/Users/alamt/Downloads/BSC/blockchain/network/crypto-config
EOF
```

Start the API:

```bash
npm run dev
```

Expected output (last few lines):
```
[nodemon] starting `ts-node src/index.ts`
BSC API Gateway running on port 3000
Connected to PostgreSQL
Connected to Redis
```

API is now available at `http://localhost:3000`

> If you see "Cannot find module" errors, run `npm install` first, then retry `npm run dev`.

---

## Full Startup Checklist

Run through this after every laptop restart:

```
[ ] Docker Desktop — green icon in taskbar
[ ] WSL2 terminal open, `docker ps` works
[ ] Fabric containers (5) — all Up
[ ] bsc-postgres — Up (healthy)
[ ] bsc-redis — Up (healthy)
[ ] `peer channel list` returns bsc-channel
[ ] API running on localhost:3000
```

---

## Stopping Everything (Clean Shutdown)

When you are done working for the day, shut down in reverse order:

```bash
# 1. Stop the API (Ctrl+C in its terminal tab)

# 2. Stop PostgreSQL and Redis
cd /mnt/c/Users/alamt/Downloads/BSC
docker compose -f docker/docker-compose.yml --project-name bsc stop postgres redis

# 3. Stop the Fabric network (keeps ledger data intact)
docker compose -f blockchain/network/docker-compose-fabric.yml --project-name bsc stop
```

> Use `stop` not `down`. `stop` preserves the named volumes (your blockchain ledger data).
> `down -v` deletes all volumes and wipes the ledger — only do that if you want a full reset.

---

## Troubleshooting

### "bsc-cli Exited" or peer containers won't start

The crypto material or genesis block is missing (happens if you ran `docker compose down -v` previously):

```bash
cd /mnt/c/Users/alamt/Downloads/BSC
bash blockchain/scripts/start-network.sh     # regenerates crypto + genesis block
sleep 10
bash blockchain/scripts/create-channel.sh    # recreates bsc-channel
```

After this, the chaincodes need to be redeployed (ledger was wiped):

```bash
# anomaly first (it's at v1.1 — needs this exact version flag)
# Check STATUS.md for the correct version numbers before running
bash blockchain/scripts/deploy-chaincode.sh
```

### "bsc-channel not found" on peer channel list

Channel was not created yet or was wiped. Recreate it:

```bash
bash blockchain/scripts/create-channel.sh
```

### API fails with "Failed to connect to peer"

The Fabric peers may still be initialising. Wait 20 seconds after starting Fabric containers before starting the API. Also confirm `peer channel list` works first.

### PostgreSQL "password authentication failed"

The `.env` file has wrong credentials. Defaults are:
- User: `bsc`
- Password: `bsc_dev_password`
- DB: `bsc_db`
- Port: `5432`

Check with: `docker exec bsc-postgres pg_isready -U bsc`

### Redis connection refused

Check the container is healthy: `docker exec bsc-redis redis-cli -a bsc_redis_dev ping`
Expected response: `PONG`

### Ports already in use (EADDRINUSE)

Another process is using port 7050, 7051, 8051, 9051, 5432, 6379, or 3000. Find and kill it:

```bash
# Example for port 3000
lsof -i :3000
kill -9 <PID>
```
