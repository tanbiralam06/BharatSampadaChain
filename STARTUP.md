# BSC — Daily Development Startup Guide

> Run these commands every time you open your machine and want to resume development.
> Your data (blockchain ledger, PostgreSQL records, Redis cache) is stored in Docker volumes
> and survives across restarts as long as you do **not** run `make reset` or `make seed`.

---

## Prerequisites (one-time checks)

- Docker Desktop is installed and **running** (check the system tray icon)
- You are in the repo root: `cd ~/Downloads/BSC`
- Node.js is installed: `node -v` should print v18 or higher

---

## Step 1 — Start Docker Desktop

Open Docker Desktop from the Start menu and wait until the whale icon in the system tray
stops animating and shows **"Docker Desktop is running"**.

---

## Step 2 — Start the database and cache

Open a terminal at the repo root and run:

```bash
docker compose -f docker/docker-compose.yml --project-name bsc up -d postgres redis
```

Verify both containers are healthy:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Expected output:

```
NAMES          STATUS          PORTS
bsc-postgres   Up X seconds    0.0.0.0:5432->5432/tcp
bsc-redis      Up X seconds    0.0.0.0:6379->6379/tcp
```

> If you also need the Hyperledger Fabric network (chaincode testing, anomaly checks):
> ```bash
> docker compose -f blockchain/network/docker-compose-fabric.yml --project-name bsc up -d
> ```
> For pure UI / API development, Fabric is optional — the API connects to it but degrades
> gracefully if it is not available.

---

## Step 3 — Start the API

Open a **new terminal** (keep the Docker one open):

```bash
cd api
npm run dev
```

Wait for this line:

```
BSC API running on port 4000
```

If you see `AggregateError` from pg-pool, PostgreSQL is not ready yet — wait 5 more seconds
and press Ctrl+C then run `npm run dev` again.

---

## Step 4 — Start the frontend apps

Each app needs its own terminal tab. Open 4 new tabs and run one command per tab:

```bash
# Terminal A — Admin Panel (port 5176)
cd frontend && npm run dev:admin

# Terminal B — Officer Console (port 5175)
cd frontend && npm run dev:officer

# Terminal C — Citizen Dashboard (port 5174)
cd frontend && npm run dev:citizen

# Terminal D — Public Dashboard (port 5173)
cd frontend && npm run dev:public
```

> You only need to start the apps you are actively working on.
> The `cd frontend` is required — all workspace scripts run from the `frontend/` directory.

---

## Step 5 — Open the apps in your browser

| App | URL | Login |
|---|---|---|
| Admin Panel | http://localhost:5176 | username: `admin` / password: `password` |
| Officer Console | http://localhost:5175 | email: `rajesh.kumar@itdept.bsc.gov` / password: `password` |
| Officer Console | http://localhost:5175 | email: `priya.sharma@cbi.gov.in` / password: `password` |
| Citizen Dashboard | http://localhost:5174 | Aadhaar: `123456789012` / password: `password` |
| Public Dashboard | http://localhost:5173 | No login required |
| API Health | http://localhost:4000/health | No login required |

> Full credentials table with all seed users and curl examples: see `DEV_CREDENTIALS.md`

---

## Applying a new database migration

Migrations only need to be run **once** when a new `.sql` file is added under `database/migrations/`.
Check the table below and apply any file you have not yet run.

| File | Purpose | Run once when |
|---|---|---|
| `001_initial_schema.sql` | Core tables | First-time setup (auto-applied by `make seed`) |
| `002_seed_data.sql` | Seed citizens, officers, flags | First-time setup (auto-applied by `make seed`) |
| `003_add_login_id.sql` | Login ID column on bsc_users | Upgrading from early builds |
| `004_totp.sql` | TOTP columns for Admin 2FA | Phase 3 upgrade — run this now if not done yet |

To apply any migration:

```bash
docker exec -i bsc-postgres psql -U bsc -d bsc_db < database/migrations/004_totp.sql
```

Replace the filename with whichever file you need to apply.

---

## Stopping at end of day

Stops all containers but **preserves all data** (Docker volumes are kept):

```bash
docker compose -f docker/docker-compose.yml --project-name bsc stop
```

If the Fabric network was also running:

```bash
docker compose -f blockchain/network/docker-compose-fabric.yml --project-name bsc stop
```

Then close Docker Desktop from the system tray.

---

## Quick-reference cheat sheet

```bash
# 1. Start infra (from repo root)
docker compose -f docker/docker-compose.yml --project-name bsc up -d postgres redis

# 2. Start API (new terminal)
cd api && npm run dev

# 3. Start whichever frontend you need (new terminal each)
cd frontend && npm run dev:admin      # → http://localhost:5176
cd frontend && npm run dev:officer    # → http://localhost:5175
cd frontend && npm run dev:citizen    # → http://localhost:5174
cd frontend && npm run dev:public     # → http://localhost:5173

# Run API tests
cd api && npm test

# Stop everything, preserve data
docker compose -f docker/docker-compose.yml --project-name bsc stop
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `AggregateError` in API logs | PostgreSQL not ready yet | Wait 5 s, Ctrl+C, re-run `npm run dev` |
| `Invalid credentials` on login | Migration `004_totp.sql` not applied | Run the migration command above |
| One Redis warning in API logs | Redis not running | Non-fatal — start redis or ignore it |
| Frontend shows blank page | API not running | Start `npm run dev` in `api/` first |
| Port already in use | Previous process still alive | `npx kill-port 4000` (or 5173–5176) |
| Docker containers not found | Docker Desktop not started | Open Docker Desktop, wait for whale icon |

---

*Data lives in Docker volumes `bsc_postgres-data` and `bsc_redis-data`.
They survive machine restarts. Only `make reset` or `make seed` will wipe them.*
