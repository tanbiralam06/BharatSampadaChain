#!/bin/bash
# Creates bsc-channel and joins all three peers.
# Run ONCE after start-network.sh. Uses the bsc-cli container.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_DIR="${SCRIPT_DIR}/../network"
CRYPTO="${NETWORK_DIR}/crypto-config"
ARTIFACTS="${NETWORK_DIR}/channel-artifacts"
CHANNEL=bsc-channel
ORDERER=orderer.bsc.gov:7050
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/bsc.gov/orderers/orderer.bsc.gov/tls/ca.crt

echo "============================================================"
echo " BSC — Creating channel: ${CHANNEL}"
echo "============================================================"

# Wait for peers to be ready
echo "→ Waiting for peers to be ready..."
sleep 5

# ── Helper: run a command inside the CLI container ───────────────
cli() {
  docker exec bsc-cli "$@"
}

# ── Step 1: Create the channel (from ITDept admin) ───────────────
echo ""
echo "→ Creating channel from ITDept..."
cli peer channel create \
  -o ${ORDERER} \
  -c ${CHANNEL} \
  -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL}.tx \
  --tls \
  --cafile ${ORDERER_CA} \
  --outputBlock /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL}.block

echo "   ✓ Channel created"

# ── Step 2: Join peer0.itdept ────────────────────────────────────
echo ""
echo "→ Joining peer0.itdept.bsc.gov..."
cli env \
  CORE_PEER_ADDRESS=peer0.itdept.bsc.gov:7051 \
  CORE_PEER_LOCALMSPID=ITDeptMSP \
  CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/itdept.bsc.gov/users/Admin@itdept.bsc.gov/msp \
  CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/itdept.bsc.gov/peers/peer0.itdept.bsc.gov/tls/ca.crt \
  peer channel join \
    -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL}.block
echo "   ✓ peer0.itdept joined"

# ── Step 3: Join peer0.registrar ────────────────────────────────
echo ""
echo "→ Joining peer0.registrar.bsc.gov..."
cli env \
  CORE_PEER_ADDRESS=peer0.registrar.bsc.gov:8051 \
  CORE_PEER_LOCALMSPID=RegistrarMSP \
  CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/registrar.bsc.gov/users/Admin@registrar.bsc.gov/msp \
  CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/registrar.bsc.gov/peers/peer0.registrar.bsc.gov/tls/ca.crt \
  peer channel join \
    -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL}.block
echo "   ✓ peer0.registrar joined"

# ── Step 4: Join peer0.mca ──────────────────────────────────────
echo ""
echo "→ Joining peer0.mca.bsc.gov..."
cli env \
  CORE_PEER_ADDRESS=peer0.mca.bsc.gov:9051 \
  CORE_PEER_LOCALMSPID=MCAMSP \
  CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/mca.bsc.gov/users/Admin@mca.bsc.gov/msp \
  CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/mca.bsc.gov/peers/peer0.mca.bsc.gov/tls/ca.crt \
  peer channel join \
    -b /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/${CHANNEL}.block
echo "   ✓ peer0.mca joined"

# ── Step 5: Update anchor peers ─────────────────────────────────
echo ""
echo "→ Updating anchor peers..."

cli env \
  CORE_PEER_ADDRESS=peer0.itdept.bsc.gov:7051 \
  CORE_PEER_LOCALMSPID=ITDeptMSP \
  CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/itdept.bsc.gov/users/Admin@itdept.bsc.gov/msp \
  CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/itdept.bsc.gov/peers/peer0.itdept.bsc.gov/tls/ca.crt \
  peer channel update \
    -o ${ORDERER} -c ${CHANNEL} \
    -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/ITDeptMSPanchors.tx \
    --tls --cafile ${ORDERER_CA}

cli env \
  CORE_PEER_ADDRESS=peer0.registrar.bsc.gov:8051 \
  CORE_PEER_LOCALMSPID=RegistrarMSP \
  CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/registrar.bsc.gov/users/Admin@registrar.bsc.gov/msp \
  CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/registrar.bsc.gov/peers/peer0.registrar.bsc.gov/tls/ca.crt \
  peer channel update \
    -o ${ORDERER} -c ${CHANNEL} \
    -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/RegistrarMSPanchors.tx \
    --tls --cafile ${ORDERER_CA}

cli env \
  CORE_PEER_ADDRESS=peer0.mca.bsc.gov:9051 \
  CORE_PEER_LOCALMSPID=MCAMSP \
  CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/mca.bsc.gov/users/Admin@mca.bsc.gov/msp \
  CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/mca.bsc.gov/peers/peer0.mca.bsc.gov/tls/ca.crt \
  peer channel update \
    -o ${ORDERER} -c ${CHANNEL} \
    -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/MCAMSPanchors.tx \
    --tls --cafile ${ORDERER_CA}

echo "   ✓ Anchor peers updated"

echo ""
echo "============================================================"
echo " Channel ${CHANNEL} is ready."
echo " Next step: ./blockchain/scripts/deploy-chaincode.sh"
echo "============================================================"
