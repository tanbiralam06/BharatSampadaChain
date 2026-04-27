---
id: deploy-chaincode
title: Deploying Chaincode
sidebar_label: Deploying Chaincode
---

# Deploying Chaincode

BSC has 4 Go chaincodes on `bsc-channel`. The deployment script is idempotent — safe to re-run at the same version.

---

## Deploy / Redeploy All Chaincodes

```bash
bash blockchain/scripts/deploy-chaincode.sh
```

This packages, installs, approves, and commits all 4 chaincodes at their current versions. Re-running at the same version skips already-installed packages.

---

## Deploy a Single Chaincode at a New Version

```bash
CC_VERSION=1.2 CC_SEQUENCE=3 CHAINCODES="property" bash blockchain/scripts/deploy-chaincode.sh
```

When upgrading, increment **both** `CC_VERSION` and `CC_SEQUENCE` together.

Example: property is currently v1.1 / sequence 2. The next upgrade is `CC_VERSION=1.2 CC_SEQUENCE=3`.

---

## Current Versions

| Chaincode | Version | Sequence | Next |
|---|---|---|---|
| `anomaly` | v1.1 | 2 | v1.2 / seq 3 |
| `property` | v1.1 | 2 | `CC_VERSION=1.2 CC_SEQUENCE=3` |
| `access` | v1.0 | 1 | v1.1 / seq 2 |
| `zkp` | v1.1 | 2 | v1.2 / seq 3 |

---

## Smoke Test

After deployment, verify all chaincodes respond:

```bash
bash blockchain/scripts/invoke-test.sh
```

---

## Manual Chaincode Query

Use the Fabric CLI container to query chaincode directly, bypassing the API:

```bash
docker exec \
  -e CORE_PEER_ADDRESS=peer0.itdept.bsc.gov:7051 \
  -e CORE_PEER_LOCALMSPID=ITDeptMSP \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/itdept.bsc.gov/users/Admin@itdept.bsc.gov/msp \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/itdept.bsc.gov/peers/peer0.itdept.bsc.gov/tls/ca.crt \
  bsc-cli peer chaincode query \
  --channelID bsc-channel \
  --name anomaly \
  -c '{"function":"GetCitizenNode","Args":["<citizenHash>"]}'
```

Replace `--name anomaly` with `property`, `access`, or `zkp` as needed.

---

## Full Reset

To destroy the network and start from scratch:

```bash
bash blockchain/scripts/reset.sh
```

:::danger Data Loss
This wipes the entire blockchain ledger. All on-chain records are permanently lost. Only use for development resets.
:::
