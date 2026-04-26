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

| Name                          | Email                          | Role    | Pages available |
|-------------------------------|--------------------------------|---------|-----------------|
| Rajesh Kumar (IT Dept)        | `rajesh.kumar@itdept.bsc.gov`  | IT_DEPT | Flags · Investigate · Family · Team |
| Priya Sharma (CBI)            | `priya.sharma@cbi.gov.in`      | CBI     | Flags · Investigate · Family · Team |
| Justice Meera Sharma (HC)     | `judge.sharma@hc.gov.in`       | COURT   | Flags · Investigate · **Court Orders** · Team |
| SBI Compliance Officer        | `compliance@sbi.co.in`         | BANK    | Flags · Investigate · **Bank Reports** · Team |

> Run migration `006_court_bank_users.sql` to seed COURT and BANK accounts.

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

# Officer — COURT
curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"judge.sharma@hc.gov.in","password":"password","role":"COURT"}'

# Officer — BANK
curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"compliance@sbi.co.in","password":"password","role":"BANK"}'

# Citizen
curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"123456789012","password":"password","role":"CITIZEN"}'

# Guest (public dashboard — no credentials)
curl -s -X POST http://localhost:4000/auth/guest

# Freeze a property (COURT token required)
COURT_TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"judge.sharma@hc.gov.in","password":"password","role":"COURT"}' | jq -r '.data.token')
curl -s -X POST http://localhost:4000/properties/PROP-MH-2019-001/freeze \
  -H "Authorization: Bearer $COURT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderRef":"HC/2024/CR-5678","reason":"Asset attachment pending trial HC/2024/CR-5678"}'

# Report bank discrepancy (BANK token required)
BANK_TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"compliance@sbi.co.in","password":"password","role":"BANK"}' | jq -r '.data.token')
curl -s -X POST "http://localhost:4000/citizens/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2/bank-flag" \
  -H "Authorization: Bearer $BANK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"discrepancyAmount":5000000,"description":"Loan EMI repayment inconsistent with declared income bracket","accountRef":"SBI/HL/2024/001234"}'

# Run benami detection scan (IT_DEPT token required)
IT_TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"rajesh.kumar@itdept.bsc.gov","password":"password","role":"IT_DEPT"}' | jq -r '.data.token')
curl -s -X POST "http://localhost:4000/citizens/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2/check-benami" \
  -H "Authorization: Bearer $IT_TOKEN"
```

---

> **Change all passwords before any demo or deployment.**
