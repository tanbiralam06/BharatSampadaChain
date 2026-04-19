# database/

PostgreSQL schema, migration files, and seed data.

## Purpose

The database is a **read-optimised off-chain index** of what is on the Hyperledger Fabric ledger.

The blockchain is the source of truth. The database exists because:
- Blockchain queries are slow for full-text search and filtering
- Public dashboard needs paginated, sorted lists — impractical to do on-chain
- PostgreSQL gives you proper indexes, foreign keys, and SQL aggregations

The sync flow: **Fabric ledger write → Fabric event → API subscribes → writes to PostgreSQL**

If the database is wiped, it can be fully reconstructed from the blockchain ledger.

## Structure

```
database/
├── schema/           — Table definitions (DDL)
│   ├── 001_citizens.sql
│   ├── 002_assets.sql
│   ├── 003_properties.sql
│   ├── 004_flags.sql
│   ├── 005_access_logs.sql
│   └── 006_notifications.sql
├── migrations/       — Sequential Flyway migration files
│   └── V1__initial_schema.sql
└── seeds/            — Test data generators
    ├── seed-citizens.js
    ├── seed-assets.js
    ├── seed-properties.js
    └── seed-flags.js
```

## Running Migrations

```bash
# Using Flyway (via Docker)
docker run --rm \
  -v $(pwd)/migrations:/flyway/sql \
  flyway/flyway:9 \
  -url=jdbc:postgresql://localhost:5432/bsc \
  -user=bsc_admin \
  -password=your_password \
  migrate
```

## Seeding Test Data

```bash
# From the api/ directory:
npm run seed

# Or directly:
cd database/seeds
node seed-citizens.js
```

## Key Tables

| Table | Purpose |
|---|---|
| `citizens` | Identity nodes — hashed ID, node type, constituency |
| `assets` | Financial assets — type, range category, linked citizen |
| `properties` | Property records — state, type, declared value, current owner |
| `anomaly_flags` | Active and resolved flags — severity, rule, created date |
| `access_logs` | Mirror of on-chain access log — for fast API queries |
| `notifications` | Citizen notification history |

## Rules

- Never store raw Aadhaar or PAN numbers. Store only the SHA-256 hash.
- Never store exact financial balances. Store range categories (e.g., `10L_1CR`).
- Every schema change = a new migration file. Never edit existing migration files.
