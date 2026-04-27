---
id: environment-vars
title: Environment Variables
sidebar_label: Environment Variables
---

# Environment Variables

All configuration is passed via environment variables. The root `.env.example` is the canonical reference.

---

## Complete Reference

| Variable | Default | Required | Description |
|---|---|---|---|
| `PORT` | `4000` | No | API listen port |
| `DATABASE_URL` | `postgresql://bsc:bsc_dev_password@localhost:5432/bsc_db` | Yes | Full PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | No | Redis connection URL. API works without Redis but response caching is disabled |
| `JWT_SECRET` | `dev_secret_change_in_production` | Yes | HMAC secret for JWT signing. Must be 32+ chars in production |
| `FABRIC_CHANNEL` | `bsc-channel` | Yes | Hyperledger Fabric channel name |
| `FABRIC_PEER_ENDPOINT` | `localhost:7051` | Yes | Host:port of the peer the API connects to via gRPC |
| `FABRIC_MSP_ID` | `ITDeptMSP` | Yes | Which organization identity the API gateway uses |
| `FABRIC_CRYPTO_PATH` | `../blockchain/network/crypto-config` | Yes | Path to Fabric cryptogen output. **Must be absolute path in Docker** |

---

## Fabric Connection Notes

The API gateway connects to Fabric as the `ITDeptMSP` admin identity by default. To connect as a different org, change `FABRIC_MSP_ID` and ensure the corresponding crypto material exists at `FABRIC_CRYPTO_PATH`.

The crypto path structure expected:
```
crypto-config/
  peerOrganizations/
    itdept.bsc.gov/
      peers/peer0.itdept.bsc.gov/tls/ca.crt
      users/Admin@itdept.bsc.gov/msp/
```

---

## Docker Compose Notes

In Docker, the API container resolves peer hostnames via the `bsc-fabric-net` Docker network. Set `FABRIC_PEER_ENDPOINT` to `peer0.itdept.bsc.gov:7051` (the internal Docker hostname), not `localhost:7051`.

The `FABRIC_CRYPTO_PATH` in Docker must be the **container-internal path**: `/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto`.

---

## Generating a Secure JWT Secret

```bash
openssl rand -hex 32
```

Copy the output to `JWT_SECRET` in `.env`. Never use the default `dev_secret_change_in_production` outside local development.
