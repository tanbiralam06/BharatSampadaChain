---
id: roles-permissions
title: Roles & Permissions
sidebar_label: Roles & Permissions
---

# Roles & Permissions

BSC has eight roles. Each role determines what data a user can read, what actions they can take, and which pages of the officer console are available to them.

---

## Role Overview

| Role | Who | Dashboard | Key Permissions |
|---|---|---|---|
| `PUBLIC` | Anyone — no login | Public Dashboard (5173) | Browse declared assets of politicians/officials |
| `CITIZEN` | Registered Indian citizen | Citizen Dashboard (5174) | View own profile, properties, flags, access log |
| `IT_DEPT` | Income Tax Department officers | Officer Console (5175) | Full investigation, anomaly checks, benami scan |
| `ED` | Enforcement Directorate | Officer Console (5175) | Full investigation, anomaly checks |
| `CBI` | Central Bureau of Investigation | Officer Console (5175) | Full investigation, anomaly checks, benami scan |
| `COURT` | High Court judges | Officer Console (5175) | Court Orders page — freeze/unfreeze properties |
| `BANK` | Bank compliance officers | Officer Console (5175) | Bank Reports page — submit financial discrepancies |
| `ADMIN` | BSC system administrators | Admin Panel (5176) | System health, officer management, permission matrix |

---

## Endpoint Access Matrix

| Endpoint | PUBLIC | CITIZEN | IT_DEPT | ED | CBI | COURT | BANK | ADMIN |
|---|---|---|---|---|---|---|---|---|
| `GET /citizens` | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `GET /citizens/:hash` | — | own | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `POST /citizens` | — | — | ✓ | — | — | — | — | ✓ |
| `POST /citizens/:hash/check-anomaly` | — | — | ✓ | — | — | — | — | ✓ |
| `POST /citizens/:hash/check-benami` | — | — | ✓ | ✓ | ✓ | — | — | ✓ |
| `POST /citizens/:hash/bank-flag` | — | — | — | — | — | — | ✓ | — |
| `GET /citizens/:hash/flags` | — | own | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `GET /citizens/:hash/access-log` | — | own | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `GET /properties/:id` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `POST /properties` | — | — | ✓ | — | — | — | — | ✓ |
| `PUT /properties/:id/transfer` | — | — | ✓ | — | — | — | — | ✓ |
| `POST /properties/:id/freeze` | — | — | — | — | — | ✓ | — | — |
| `POST /properties/:id/unfreeze` | — | — | — | — | — | ✓ | — | — |
| `GET /properties/:id/court-orders` | — | — | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| `GET /flags` | — | — | ✓ | ✓ | ✓ | — | — | ✓ |
| `PUT /flags/:id` | — | — | ✓ | ✓ | ✓ | — | — | ✓ |
| `POST /flags/manual` | — | — | ✓ | ✓ | ✓ | — | — | — |
| `POST /zkp/:hash/prove` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `GET /zkp/:hash/claims` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `GET /admin/health` | — | — | — | — | — | — | — | ✓ |
| `GET /admin/stats` | — | — | — | — | — | — | — | ✓ |

`own` = CITIZEN role can only access their own data (hash must match JWT subject)

---

## Permission Matrix on Chain

The permission matrix is stored in the `access` chaincode as `PERM_<role>_<dataType>` keys. Admins can update it dynamically via `PUT /admin/permissions/:role`.

Default `requiresAuthorizationRef` values:
- Officers (IT_DEPT, ED, CBI, COURT, BANK): `true` — must provide case reference when accessing citizen data
- ADMIN, PUBLIC, CITIZEN: `false`

---

## Officer Console Navigation

The officer console nav is filtered by role — each officer sees only the pages relevant to their function:

| Page | Visible To |
|---|---|
| Active Flags | All officers |
| Investigate | All officers |
| Family Analysis | IT_DEPT, ED, CBI, ADMIN |
| My Team | All officers |
| Court Orders | COURT only |
| Bank Reports | BANK only |

---

## Extending Roles

To add a new role:

1. Add the role string to `AccessorRole` in `api/src/models/index.ts`
2. Add a JWT payload entry in `api/src/routes/auth.ts`
3. Add the role to `requireRole()` calls on relevant endpoints
4. Call `UpdatePermissionRule` on the access chaincode for the new role
5. Add nav items to `frontend/officer-console/src/components/Layout.tsx`
