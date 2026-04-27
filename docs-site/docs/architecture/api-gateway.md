---
id: api-gateway
title: API Gateway
sidebar_label: API Gateway
---

# API Gateway

The API gateway is a Node.js + TypeScript + Express application that bridges the React frontends to the Hyperledger Fabric blockchain and PostgreSQL mirror.

**Source:** `api/src/` · **Port:** 4000 · **Language:** TypeScript

---

## Request Flow

```
Client Request
  → routes/         (Express router — path matching, middleware wiring)
  → requireRole()   (JWT verification + role enforcement)
  → services/       (business logic — rules, validation, cross-concern calls)
  → fabric/contracts.ts  (chaincode call — evaluateTransaction or submitTransaction)
  → chaincode        (Hyperledger Fabric)
  → logAccess()     (access chaincode + PostgreSQL audit)
  → Response
```

---

## Key Modules

### `fabric/connection.ts`

Singleton Gateway + gRPC client. `getContract(chaincodeName)` is the entry point for all chaincode calls. The gateway connects as the ITDept Admin identity by default (controlled by `FABRIC_MSP_ID` env var).

### `fabric/contracts.ts`

One typed function per chaincode method. All chaincode args are strings on the wire — numeric values use `String(n)` before passing. `evaluateTransaction` for reads, `submitTransaction` for writes.

### `services/`

Business logic layer. Services call `fabric/contracts.ts` and call `fabric/contracts.logAccess()` to write an access log whenever citizen data is read by a non-citizen role. Redis caching is applied at this layer (60s TTL on citizen reads).

### `models/index.ts`

Canonical TypeScript types shared across the whole API. These mirror the Go structs in the chaincodes.

### `utils/asyncHandler.ts`

Wrap every async route handler with this to route errors to the global error middleware. All route handlers use it.

---

## Authentication

All endpoints except `/health`, `POST /auth/login`, `POST /auth/guest`, and `POST /auth/totp/verify` require a valid JWT Bearer token.

```
Authorization: Bearer <token>
```

Tokens are issued by `POST /auth/login` with `identifier` (Aadhaar / email / username), `password`, and `role`. The `role` field is validated server-side — a CITIZEN cannot claim IT_DEPT.

---

## Role Enforcement

The `requireRole(...roles)` middleware reads the JWT payload and verifies the caller's role is in the allowed list. Citizens additionally have an ownership check — they can only read their own data.

```typescript
// Example from routes/properties.ts
router.post('/:id/freeze',
  requireRole('COURT'),
  asyncHandler(async (req, res) => { ... })
);
```

---

## Access Logging

Every time a non-citizen role reads citizen data:
1. `logAccess()` writes an immutable record to the `access` chaincode
2. `notifyOfficerAccess()` writes a row to PostgreSQL's `system_audit` table

This is non-negotiable — it is enforced in the service layer, not left to individual route handlers.

---

## Error Handling

The global error middleware in `app.ts` forwards `err.status` to the HTTP response code:
```
4xx errors → client errors (bad input, unauthorized, not found)
5xx errors → server errors (Fabric unreachable, DB failure)
```

All errors return: `{ success: false, error: "message" }`

---

## Rate Limiting

- Global: 200 requests per 15 minutes per IP
- `/auth` routes: 20 requests per 15 minutes per IP

---

## Running the API

```bash
cd api
npm run dev      # hot reload with ts-node-dev
npm run build    # compile TypeScript → dist/
npm run lint     # ESLint
npm test         # Jest + Supertest (120 tests)
```
