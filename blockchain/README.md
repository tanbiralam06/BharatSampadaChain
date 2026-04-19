# blockchain/

Hyperledger Fabric network configuration and Go chaincode (smart contracts).

## Structure

```
blockchain/
├── network/      — Fabric network config: peers, orderer, channels, TLS, MSP crypto material
├── chaincode/    — Four Go smart contracts, one per subdirectory
│   ├── anomaly/  — WEALTH_ANOMALY_DETECTOR
│   ├── property/ — PROPERTY_TRANSFER_VALIDATOR
│   ├── access/   — ACCESS_PERMISSION_ENFORCER
│   └── zkp/      — ZKP_VERIFIER
└── scripts/      — Shell scripts: start network, deploy chaincode, teardown
```

## Quick Commands

```bash
# Start local Fabric testnet (3 peers + orderer)
./scripts/start-network.sh

# Deploy all chaincode
./scripts/deploy-chaincode.sh

# Run chaincode tests
cd chaincode/anomaly && go test ./...

# Tear down network
./scripts/teardown.sh
```

## Prerequisites

- Docker 24+ and Docker Compose v2
- Go 1.22+
- Hyperledger Fabric binaries (downloaded by `scripts/install-fabric.sh`)

## Key Design Decisions

- **No public blockchain.** Hyperledger Fabric is permissioned — no tokens, no gas fees.
- **One chaincode per contract.** Each contract is independently deployable and testable.
- **Fabric SDK integration** is in `api/src/fabric/` — not here. The blockchain folder contains only the chain-side code.
- **No raw PII in chaincode.** All identity references are SHA-256 hashed before they reach this layer.
