#!/bin/bash
# Packages, installs, approves, and commits all 4 BSC chaincodes.
# Run from repo root: ./blockchain/scripts/deploy-chaincode.sh
# To upgrade: increment CC_VERSION and re-run.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_DIR="${SCRIPT_DIR}/../network"
CHANNEL=bsc-channel
ORDERER=orderer.bsc.gov:7050
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/bsc.gov/orderers/orderer.bsc.gov/tls/ca.crt

CC_VERSION="1.0"
CC_SEQUENCE=1

# Chaincode names and source paths (inside CLI container)
CC_BASE=/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode
CHAINCODES=("anomaly" "property" "access" "zkp")

echo "============================================================"
echo " BSC — Deploying chaincode v${CC_VERSION}"
echo "============================================================"

# ── Helper ───────────────────────────────────────────────────────
peer_cmd() {
  local ORG=$1; shift
  local PEER_ADDR=$1; shift
  local MSP_ID=$1; shift
  local TLS_CERT=$1; shift

  docker exec \
    -e CORE_PEER_ADDRESS=${PEER_ADDR} \
    -e CORE_PEER_LOCALMSPID=${MSP_ID} \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/${ORG}/users/Admin@${ORG}/msp \
    -e CORE_PEER_TLS_ROOTCERT_FILE=${TLS_CERT} \
    bsc-cli peer "$@"
}

# Org definitions: name, peer address, MSP ID, TLS cert
declare -A ORGS
ORGS[itdept.bsc.gov]="peer0.itdept.bsc.gov:7051|ITDeptMSP|/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/itdept.bsc.gov/peers/peer0.itdept.bsc.gov/tls/ca.crt"
ORGS[registrar.bsc.gov]="peer0.registrar.bsc.gov:8051|RegistrarMSP|/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/registrar.bsc.gov/peers/peer0.registrar.bsc.gov/tls/ca.crt"
ORGS[mca.bsc.gov]="peer0.mca.bsc.gov:9051|MCAMSP|/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/mca.bsc.gov/peers/peer0.mca.bsc.gov/tls/ca.crt"

for CC_NAME in "${CHAINCODES[@]}"; do
  echo ""
  echo "────────────────────────────────────────────────────────────"
  echo " Processing chaincode: ${CC_NAME}"
  echo "────────────────────────────────────────────────────────────"

  # ── Package ───────────────────────────────────────────────────
  echo "→ Packaging ${CC_NAME}..."
  docker exec bsc-cli peer lifecycle chaincode package \
    /tmp/${CC_NAME}.tar.gz \
    --path ${CC_BASE}/${CC_NAME} \
    --lang golang \
    --label ${CC_NAME}_${CC_VERSION}
  echo "   ✓ Packaged"

  # ── Install on all peers ──────────────────────────────────────
  for ORG_DOMAIN in "${!ORGS[@]}"; do
    IFS='|' read -r PEER_ADDR MSP_ID TLS_CERT <<< "${ORGS[$ORG_DOMAIN]}"
    echo "→ Installing on peer ${PEER_ADDR}..."
    peer_cmd "${ORG_DOMAIN}" "${PEER_ADDR}" "${MSP_ID}" "${TLS_CERT}" \
      lifecycle chaincode install /tmp/${CC_NAME}.tar.gz
    echo "   ✓ Installed on ${ORG_DOMAIN}"
  done

  # ── Get package ID from ITDept peer ──────────────────────────
  ITDEPT_INFO="${ORGS[itdept.bsc.gov]}"
  IFS='|' read -r PEER_ADDR MSP_ID TLS_CERT <<< "${ITDEPT_INFO}"

  PKG_ID=$(peer_cmd "itdept.bsc.gov" "${PEER_ADDR}" "${MSP_ID}" "${TLS_CERT}" \
    lifecycle chaincode queryinstalled 2>&1 \
    | grep "Package ID: ${CC_NAME}_${CC_VERSION}" \
    | sed -n "s/Package ID: \(.*\), Label:.*/\1/p")
  echo "   Package ID: ${PKG_ID}"

  # ── Approve from each org ─────────────────────────────────────
  for ORG_DOMAIN in "${!ORGS[@]}"; do
    IFS='|' read -r PEER_ADDR MSP_ID TLS_CERT <<< "${ORGS[$ORG_DOMAIN]}"
    echo "→ Approving from ${MSP_ID}..."
    peer_cmd "${ORG_DOMAIN}" "${PEER_ADDR}" "${MSP_ID}" "${TLS_CERT}" \
      lifecycle chaincode approveformyorg \
        -o ${ORDERER} \
        --channelID ${CHANNEL} \
        --name ${CC_NAME} \
        --version ${CC_VERSION} \
        --package-id "${PKG_ID}" \
        --sequence ${CC_SEQUENCE} \
        --tls --cafile ${ORDERER_CA}
    echo "   ✓ Approved by ${MSP_ID}"
  done

  # ── Check commit readiness ────────────────────────────────────
  echo "→ Checking commit readiness..."
  ITDEPT_INFO="${ORGS[itdept.bsc.gov]}"
  IFS='|' read -r PEER_ADDR MSP_ID TLS_CERT <<< "${ITDEPT_INFO}"
  peer_cmd "itdept.bsc.gov" "${PEER_ADDR}" "${MSP_ID}" "${TLS_CERT}" \
    lifecycle chaincode checkcommitreadiness \
      --channelID ${CHANNEL} \
      --name ${CC_NAME} \
      --version ${CC_VERSION} \
      --sequence ${CC_SEQUENCE} \
      --tls --cafile ${ORDERER_CA} \
      --output json

  # ── Commit ────────────────────────────────────────────────────
  echo "→ Committing ${CC_NAME} to channel..."
  peer_cmd "itdept.bsc.gov" "${PEER_ADDR}" "${MSP_ID}" "${TLS_CERT}" \
    lifecycle chaincode commit \
      -o ${ORDERER} \
      --channelID ${CHANNEL} \
      --name ${CC_NAME} \
      --version ${CC_VERSION} \
      --sequence ${CC_SEQUENCE} \
      --tls --cafile ${ORDERER_CA} \
      --peerAddresses peer0.itdept.bsc.gov:7051 \
      --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/itdept.bsc.gov/peers/peer0.itdept.bsc.gov/tls/ca.crt \
      --peerAddresses peer0.registrar.bsc.gov:8051 \
      --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/registrar.bsc.gov/peers/peer0.registrar.bsc.gov/tls/ca.crt \
      --peerAddresses peer0.mca.bsc.gov:9051 \
      --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/mca.bsc.gov/peers/peer0.mca.bsc.gov/tls/ca.crt
  echo "   ✓ ${CC_NAME} committed"
done

echo ""
echo "============================================================"
echo " All chaincodes deployed successfully."
echo " Next step: ./blockchain/scripts/invoke-test.sh"
echo "============================================================"
