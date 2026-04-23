#!/bin/bash
# Generates crypto material + genesis block, then starts the Fabric network.
# Run this from the repo root: ./blockchain/scripts/start-network.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_DIR="${SCRIPT_DIR}/../network"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo "============================================================"
echo " BSC — Starting Fabric Testnet"
echo "============================================================"

# ── Step 1: Generate crypto material ────────────────────────────
echo ""
echo "→ Generating crypto material with cryptogen..."

mkdir -p "${NETWORK_DIR}/crypto-config"
mkdir -p "${NETWORK_DIR}/channel-artifacts"

docker run --rm \
  -v "${NETWORK_DIR}:/fabric" \
  hyperledger/fabric-tools:2.5 \
  cryptogen generate \
    --config=/fabric/crypto-config.yaml \
    --output=/fabric/crypto-config

echo "   ✓ Crypto material generated"

# ── Step 2: Generate genesis block ──────────────────────────────
echo ""
echo "→ Generating system channel genesis block..."

docker run --rm \
  -v "${NETWORK_DIR}:/fabric" \
  -e FABRIC_CFG_PATH=/fabric \
  hyperledger/fabric-tools:2.5 \
  configtxgen \
    -profile BSCGenesis \
    -channelID system-channel \
    -outputBlock /fabric/channel-artifacts/genesis.block

echo "   ✓ Genesis block created"

# ── Step 3: Generate channel transaction ────────────────────────
echo ""
echo "→ Generating bsc-channel transaction..."

docker run --rm \
  -v "${NETWORK_DIR}:/fabric" \
  -e FABRIC_CFG_PATH=/fabric \
  hyperledger/fabric-tools:2.5 \
  configtxgen \
    -profile BSCChannel \
    -outputCreateChannelTx /fabric/channel-artifacts/bsc-channel.tx \
    -channelID bsc-channel

echo "   ✓ Channel transaction created"

# ── Step 4: Generate anchor peer transactions ────────────────────
echo ""
echo "→ Generating anchor peer transactions..."

for ORG in ITDeptMSP RegistrarMSP MCAMSP; do
  docker run --rm \
    -v "${NETWORK_DIR}:/fabric" \
    -e FABRIC_CFG_PATH=/fabric \
    hyperledger/fabric-tools:2.5 \
    configtxgen \
      -profile BSCChannel \
      -outputAnchorPeersUpdate /fabric/channel-artifacts/${ORG}anchors.tx \
      -channelID bsc-channel \
      -asOrg ${ORG}
  echo "   ✓ Anchor peer tx for ${ORG}"
done

# ── Step 5: Start Docker containers ─────────────────────────────
echo ""
echo "→ Starting Fabric containers..."

docker compose \
  -f "${NETWORK_DIR}/docker-compose-fabric.yml" \
  --project-name bsc \
  up -d

echo "   ✓ Containers started"

echo ""
echo "============================================================"
echo " Network is up! Peers and orderer are starting..."
echo " Wait 5 seconds, then run: ./blockchain/scripts/create-channel.sh"
echo "============================================================"
