# blockchain/scripts/

Shell scripts for managing the Hyperledger Fabric network lifecycle.

## Scripts

| Script | Purpose | When to Run |
|---|---|---|
| `install-fabric.sh` | Downloads Fabric binaries and Docker images | Once, on first setup |
| `start-network.sh` | Starts all peer and orderer containers | Every dev session |
| `create-channel.sh` | Creates `bsc-channel` and joins all peers | Once, after network start |
| `deploy-chaincode.sh` | Packages, installs, approves, commits all 4 contracts | After any chaincode change |
| `invoke-test.sh` | Sends a test transaction to verify the network is working | After deployment |
| `teardown.sh` | Stops all containers and removes crypto material | When done developing |
| `reset.sh` | Full teardown + restart fresh | When ledger state is corrupted |

## Usage Order (First Time)

```bash
# 1. Download Fabric
./scripts/install-fabric.sh

# 2. Start the network
./scripts/start-network.sh

# 3. Create the channel (only needed once)
./scripts/create-channel.sh

# 4. Deploy chaincode
./scripts/deploy-chaincode.sh

# 5. Verify it works
./scripts/invoke-test.sh
```

## After Chaincode Changes

```bash
# Increment the version in deploy-chaincode.sh, then:
./scripts/deploy-chaincode.sh
```

## Environment Variables Required

```bash
export FABRIC_CFG_PATH=./network
export CORE_PEER_TLS_ENABLED=true
```

These are set automatically by `start-network.sh` when sourced with `. ./scripts/start-network.sh`.
