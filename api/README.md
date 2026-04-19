# api/

Node.js + TypeScript API gateway. The single point of access between all frontends and the Hyperledger Fabric blockchain.

## Structure

```
api/
├── src/
│   ├── routes/       — URL handlers (thin layer, no business logic)
│   ├── middleware/   — JWT auth, role guard, rate limiting, request logging
│   ├── services/     — All business logic (anomaly scoring, notifications, search)
│   ├── models/       — TypeScript interfaces and data types
│   ├── fabric/       — Hyperledger Fabric SDK integration (ONLY place that touches blockchain)
│   └── config/       — Environment variable loading and validation
└── tests/
    ├── unit/         — Service-level tests (mocked Fabric)
    ├── integration/  — API endpoint tests against real Fabric testnet
    └── postman/      — Postman collection for manual testing
```

## Setup

```bash
npm install
cp ../.env.example ../.env   # configure environment variables
npm run dev                   # starts on http://localhost:4000
```

## Key Commands

```bash
npm run dev          # Development server with hot reload
npm run build        # Compile TypeScript to dist/
npm run start        # Start compiled production build
npm test             # Run unit tests
npm run test:integration  # Run integration tests (needs Fabric running)
npm run test:e2e     # Run end-to-end tests (needs full stack)
npm run seed         # Seed PostgreSQL with test data
npm run lint         # ESLint
npm run format       # Prettier
```

## Architecture Rule

**The `fabric/` directory is the only place that calls `fabric-network` SDK functions.**

All other files in `src/` call `fabric/gateway.ts` functions — they never import from `@hyperledger/fabric-gateway` directly. This means swapping the blockchain layer requires changes in one directory only.

## API Documentation

Interactive docs at `http://localhost:4000/docs` (Swagger UI, served from `docs/api.yaml`).

## Authentication

All endpoints (except `/api/v1/public/*`) require a JWT Bearer token. Tokens are issued by `POST /api/v1/auth/login` with role credentials.

Token payload:
```json
{
  "user_id": "OFF-DL-00142",
  "role": "OFFICER",
  "agency": "IT-Department-Delhi",
  "iat": 1745000000,
  "exp": 1745001800
}
```
