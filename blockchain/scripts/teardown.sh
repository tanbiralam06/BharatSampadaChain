#!/bin/bash
# Stops all containers and removes crypto material.
# Data on the ledger is lost. Run start-network.sh to start fresh.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_DIR="${SCRIPT_DIR}/../network"

echo "============================================================"
echo " BSC — Tearing down Fabric network"
echo "============================================================"

echo "→ Stopping and removing containers..."
docker compose \
  -f "${NETWORK_DIR}/docker-compose-fabric.yml" \
  --project-name bsc \
  down --volumes --remove-orphans 2>/dev/null || true

echo "→ Removing generated crypto material..."
rm -rf "${NETWORK_DIR}/crypto-config"
rm -rf "${NETWORK_DIR}/channel-artifacts"

echo "→ Removing any leftover chaincode containers..."
docker ps -a --filter "name=dev-peer" --format "{{.ID}}" | xargs -r docker rm -f

echo "→ Removing chaincode images..."
docker images --filter "reference=dev-peer*" --format "{{.ID}}" | xargs -r docker rmi -f

echo ""
echo "============================================================"
echo " Network torn down. Run start-network.sh to start fresh."
echo "============================================================"
