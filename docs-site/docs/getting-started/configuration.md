---
id: configuration
title: Configuration Reference
sidebar_label: Configuration Reference
---

# Configuration Reference

All configuration is passed via environment variables. Copy `.env.example` to `.env` in the repo root and edit before starting any services.

---

## Environment Variables

| Variable | Default | Required | Notes |
|---|---|---|---|
| `PORT` | `4000` | No | API listen port |
| `DATABASE_URL` | `postgresql://bsc:bsc_dev_password@localhost:5432/bsc_db` | Yes | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | No | Redis connection. API works without Redis (slower) |
| `JWT_SECRET` | `dev_secret_change_in_production` | Yes | Must be 32+ characters in production |
| `FABRIC_CHANNEL` | `bsc-channel` | Yes | Fabric channel name |
| `FABRIC_PEER_ENDPOINT` | `localhost:7051` | Yes | Host:port of the peer the API connects to |
| `FABRIC_MSP_ID` | `ITDeptMSP` | Yes | Which org identity the API uses |
| `FABRIC_CRYPTO_PATH` | `../blockchain/network/crypto-config` | Yes | **Must be absolute path in Docker** |

---

## Docker Compose Variables

The `docker-compose.yml` reads these from `.env.example` at the repo root:

```env
POSTGRES_USER=bsc
POSTGRES_PASSWORD=change_this_password
POSTGRES_DB=bsc_db

REDIS_PASSWORD=change_this_redis_password

JWT_SECRET=change_this_to_32_random_chars_minimum

FABRIC_CHANNEL=bsc-channel
FABRIC_MSP_ID=ITDeptMSP
FABRIC_PEER_ENDPOINT=peer0.itdept.bsc.gov:7051
FABRIC_CRYPTO_PATH=/opt/gopath/src/.../crypto-config
```

---

## Database Migrations

Migrations live in `database/migrations/` and must be applied in order.

| File | Purpose | Applied by |
|---|---|---|
| `001_initial_schema.sql` | Core tables: citizens, properties, flags, logs | `make seed` |
| `002_seed_data.sql` | 10 test citizens, 3 system officers | `make seed` |
| `003_add_login_id.sql` | `login_id` column on `bsc_users` | Manual once |
| `004_totp.sql` | TOTP 2FA columns for admin | Manual once |
| `005_permissions.sql` | Permission matrix mirror table | Manual once |
| `006_court_bank_users.sql` | COURT and BANK seed accounts | Manual once |

To apply a single migration:
```bash
docker exec -i bsc-postgres psql -U bsc -d bsc_db < database/migrations/006_court_bank_users.sql
```

---

## Production Checklist

:::danger Before any demo or deployment
Change all of the following. The defaults are intentionally weak for local development.
:::

- [ ] `JWT_SECRET` — generate with `openssl rand -hex 32`
- [ ] `POSTGRES_PASSWORD` — use a strong password
- [ ] `REDIS_PASSWORD` — enable Redis AUTH
- [ ] `FABRIC_CRYPTO_PATH` — set to absolute container path
- [ ] TLS — all Fabric peers and orderer run TLS in the provided config; do not disable
- [ ] CORS — update `allowedOrigins` in `api/src/app.ts` to match production domains
- [ ] Rate limits — review `express-rate-limit` settings in `api/src/app.ts`
