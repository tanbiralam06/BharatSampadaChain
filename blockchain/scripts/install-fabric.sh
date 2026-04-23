#!/bin/bash
# Pulls all required Hyperledger Fabric 2.5 Docker images.
# No host binaries needed — everything runs in containers.

set -euo pipefail

FABRIC_VERSION="2.5"
FABRIC_CA_VERSION="1.5"

IMAGES=(
  "hyperledger/fabric-peer:${FABRIC_VERSION}"
  "hyperledger/fabric-orderer:${FABRIC_VERSION}"
  "hyperledger/fabric-tools:${FABRIC_VERSION}"
  "hyperledger/fabric-ccenv:${FABRIC_VERSION}"
  "hyperledger/fabric-baseos:${FABRIC_VERSION}"
  "hyperledger/fabric-ca:${FABRIC_CA_VERSION}"
  "couchdb:3.3"
  "postgres:15"
  "redis:7"
)

echo "============================================================"
echo " BSC — Pulling Hyperledger Fabric ${FABRIC_VERSION} images"
echo "============================================================"

for IMAGE in "${IMAGES[@]}"; do
  echo ""
  echo "→ Pulling ${IMAGE} ..."
  docker pull "${IMAGE}"
done

echo ""
echo "============================================================"
echo " All images pulled successfully."
echo " Next step: run ./blockchain/scripts/start-network.sh"
echo "============================================================"
