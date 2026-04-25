# BSC Dev Credentials

All seed accounts use password: `password`

---

## Admin Panel — `http://localhost:5176`

| Field    | Value   |
|----------|---------|
| Username | `admin` |
| Password | `password` |

---

## Officer Console — `http://localhost:5175`

| Name                   | Email                          | Role    |
|------------------------|--------------------------------|---------|
| Rajesh Kumar (IT Dept) | `rajesh.kumar@itdept.bsc.gov`  | IT_DEPT |
| Priya Sharma (CBI)     | `priya.sharma@cbi.gov.in`      | CBI     |

---

## Citizen Dashboard — `http://localhost:5174`

| Name           | Aadhaar Number | Role    |
|----------------|----------------|---------|
| Arjun Mehta    | `123456789012` | CITIZEN |
| Sunita Rao     | `234567890123` | CITIZEN |
| Priya Krishnan | `345678901234` | CITIZEN |

---

## Public Dashboard — `http://localhost:5173`

No login required. A guest JWT is fetched automatically on page load.

---

## API Direct (curl / Postman)

```bash
# Admin
curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"password","role":"ADMIN"}'

# Officer — IT_DEPT
curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"rajesh.kumar@itdept.bsc.gov","password":"password","role":"IT_DEPT"}'

# Officer — CBI
curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"priya.sharma@cbi.gov.in","password":"password","role":"CBI"}'

# Citizen
curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"123456789012","password":"password","role":"CITIZEN"}'

# Guest (public dashboard — no credentials)
curl -s -X POST http://localhost:4000/auth/guest
```

---

> **Change all passwords before any demo or deployment.**
