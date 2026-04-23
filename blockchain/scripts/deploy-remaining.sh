#!/bin/bash
# Deploys property (v1.1 — fixes compile error), access, and zkp.
# Run AFTER anomaly is already committed. Anomaly is skipped here.

set -euo pipefail

CHANNEL=bsc-channel
ORDERER=orderer.bsc.gov:7050
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/bsc.gov/orderers/orderer.bsc.gov/tls/ca.crt

CC_BASE=/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode

echo "============================================================"
echo " BSC — Deploying remaining chaincodes (property v1.1, access v1.0, zkp v1.0)"
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

ITDEPT_ADDR="peer0.itdept.bsc.gov:7051"
ITDEPT_MSP="ITDeptMSP"
ITDEPT_TLS="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/itdept.bsc.gov/peers/peer0.itdept.bsc.gov/tls/ca.crt"

REGISTRAR_ADDR="peer0.registrar.bsc.gov:8051"
REGISTRAR_MSP="RegistrarMSP"
REGISTRAR_TLS="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/registrar.bsc.gov/peers/peer0.registrar.bsc.gov/tls/ca.crt"

MCA_ADDR="peer0.mca.bsc.gov:9051"
MCA_MSP="MCAMSP"
MCA_TLS="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/mca.bsc.gov/peers/peer0.mca.bsc.gov/tls/ca.crt"

deploy_cc() {
  local CC_NAME=$1
  local CC_VERSION=$2
  local CC_SEQUENCE=$3

  echo ""
  echo "────────────────────────────────────────────────────────────"
  echo " Deploying: ${CC_NAME} v${CC_VERSION} (sequence ${CC_SEQUENCE})"
  echo "────────────────────────────────────────────────────────────"

  # ── Package ───────────────────────────────────────────────────
  echo "→ Packaging ${CC_NAME}..."
  docker exec bsc-cli peer lifecycle chaincode package \
    /tmp/${CC_NAME}_${CC_VERSION}.tar.gz \
    --path ${CC_BASE}/${CC_NAME} \
    --lang golang \
    --label ${CC_NAME}_${CC_VERSION}
  echo "   ✓ Packaged"

  # ── Install on all 3 peers ─────────────────────────────────────
  echo "→ Installing on peer0.itdept.bsc.gov..."
  peer_cmd "itdept.bsc.gov" "${ITDEPT_ADDR}" "${ITDEPT_MSP}" "${ITDEPT_TLS}" \
    lifecycle chaincode install /tmp/${CC_NAME}_${CC_VERSION}.tar.gz
  echo "   ✓ Installed on ITDept"

  echo "→ Installing on peer0.registrar.bsc.gov..."
  peer_cmd "registrar.bsc.gov" "${REGISTRAR_ADDR}" "${REGISTRAR_MSP}" "${REGISTRAR_TLS}" \
    lifecycle chaincode install /tmp/${CC_NAME}_${CC_VERSION}.tar.gz
  echo "   ✓ Installed on Registrar"

  echo "→ Installing on peer0.mca.bsc.gov..."
  peer_cmd "mca.bsc.gov" "${MCA_ADDR}" "${MCA_MSP}" "${MCA_TLS}" \
    lifecycle chaincode install /tmp/${CC_NAME}_${CC_VERSION}.tar.gz
  echo "   ✓ Installed on MCA"

  # ── Get package ID ────────────────────────────────────────────
  PKG_ID=$(peer_cmd "itdept.bsc.gov" "${ITDEPT_ADDR}" "${ITDEPT_MSP}" "${ITDEPT_TLS}" \
    lifecycle chaincode queryinstalled 2>&1 \
    | grep "Package ID: ${CC_NAME}_${CC_VERSION}" \
    | sed -n "s/Package ID: \(.*\), Label:.*/\1/p")
  echo "   Package ID: ${PKG_ID}"

  # ── Approve from all 3 orgs ───────────────────────────────────
  echo "→ Approving from ITDeptMSP..."
  peer_cmd "itdept.bsc.gov" "${ITDEPT_ADDR}" "${ITDEPT_MSP}" "${ITDEPT_TLS}" \
    lifecycle chaincode approveformyorg \
      -o ${ORDERER} \
      --channelID ${CHANNEL} \
      --name ${CC_NAME} \
      --version ${CC_VERSION} \
      --package-id "${PKG_ID}" \
      --sequence ${CC_SEQUENCE} \
      --tls --cafile ${ORDERER_CA}
  echo "   ✓ Approved by ITDeptMSP"

  echo "→ Approving from RegistrarMSP..."
  peer_cmd "registrar.bsc.gov" "${REGISTRAR_ADDR}" "${REGISTRAR_MSP}" "${REGISTRAR_TLS}" \
    lifecycle chaincode approveformyorg \
      -o ${ORDERER} \
      --channelID ${CHANNEL} \
      --name ${CC_NAME} \
      --version ${CC_VERSION} \
      --package-id "${PKG_ID}" \
      --sequence ${CC_SEQUENCE} \
      --tls --cafile ${ORDERER_CA}
  echo "   ✓ Approved by RegistrarMSP"

  echo "→ Approving from MCAMSP..."
  peer_cmd "mca.bsc.gov" "${MCA_ADDR}" "${MCA_MSP}" "${MCA_TLS}" \
    lifecycle chaincode approveformyorg \
      -o ${ORDERER} \
      --channelID ${CHANNEL} \
      --name ${CC_NAME} \
      --version ${CC_VERSION} \
      --package-id "${PKG_ID}" \
      --sequence ${CC_SEQUENCE} \
      --tls --cafile ${ORDERER_CA}
  echo "   ✓ Approved by MCAMSP"

  # ── Commit readiness ──────────────────────────────────────────
  echo "→ Checking commit readiness..."
  peer_cmd "itdept.bsc.gov" "${ITDEPT_ADDR}" "${ITDEPT_MSP}" "${ITDEPT_TLS}" \
    lifecycle chaincode checkcommitreadiness \
      --channelID ${CHANNEL} \
      --name ${CC_NAME} \
      --version ${CC_VERSION} \
      --sequence ${CC_SEQUENCE} \
      --tls --cafile ${ORDERER_CA} \
      --output json

  # ── Commit ────────────────────────────────────────────────────
  echo "→ Committing ${CC_NAME} to channel..."
  peer_cmd "itdept.bsc.gov" "${ITDEPT_ADDR}" "${ITDEPT_MSP}" "${ITDEPT_TLS}" \
    lifecycle chaincode commit \
      -o ${ORDERER} \
      --channelID ${CHANNEL} \
      --name ${CC_NAME} \
      --version ${CC_VERSION} \
      --sequence ${CC_SEQUENCE} \
      --tls --cafile ${ORDERER_CA} \
      --peerAddresses ${ITDEPT_ADDR} \
      --tlsRootCertFiles ${ITDEPT_TLS} \
      --peerAddresses ${REGISTRAR_ADDR} \
      --tlsRootCertFiles ${REGISTRAR_TLS} \
      --peerAddresses ${MCA_ADDR} \
      --tlsRootCertFiles ${MCA_TLS}
  echo "   ✓ ${CC_NAME} committed"
}

# property v1.1 — skips broken v1.0 that may be installed on ITDept peer
deploy_cc "property" "1.1" "1"

# access v1.0 — first deploy; also run InitLedger to seed the permission matrix
deploy_cc "access" "1.0" "1"

echo ""
echo "→ Initialising access ledger (seeds permission matrix)..."
docker exec \
  -e CORE_PEER_ADDRESS=${ITDEPT_ADDR} \
  -e CORE_PEER_LOCALMSPID=${ITDEPT_MSP} \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/itdept.bsc.gov/users/Admin@itdept.bsc.gov/msp \
  -e CORE_PEER_TLS_ROOTCERT_FILE=${ITDEPT_TLS} \
  bsc-cli peer chaincode invoke \
    -o ${ORDERER} \
    --channelID ${CHANNEL} \
    --name access \
    --tls --cafile ${ORDERER_CA} \
    --peerAddresses ${ITDEPT_ADDR} --tlsRootCertFiles ${ITDEPT_TLS} \
    --peerAddresses ${REGISTRAR_ADDR} --tlsRootCertFiles ${REGISTRAR_TLS} \
    --waitForEvent \
    -c '{"function":"InitLedger","Args":[]}'
echo "   ✓ access InitLedger OK"

# zkp v1.0 — first deploy
deploy_cc "zkp" "1.0" "1"

echo ""
echo "============================================================"
echo " property, access, zkp deployed successfully."
echo " Run: ./blockchain/scripts/invoke-test.sh"
echo "============================================================"
