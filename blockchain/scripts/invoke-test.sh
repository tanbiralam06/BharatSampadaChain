#!/bin/bash
# Sends test transactions to verify all chaincodes are working.

set -euo pipefail

CHANNEL=bsc-channel
ORDERER=orderer.bsc.gov:7050
ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/bsc.gov/orderers/orderer.bsc.gov/tls/ca.crt
ITDEPT_TLS=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/itdept.bsc.gov/peers/peer0.itdept.bsc.gov/tls/ca.crt
REGISTRAR_TLS=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/registrar.bsc.gov/peers/peer0.registrar.bsc.gov/tls/ca.crt

echo "============================================================"
echo " BSC — Running chaincode smoke tests"
echo "============================================================"

# Run as ITDept admin (default peer in CLI)
cli_itdept() {
  docker exec \
    -e CORE_PEER_ADDRESS=peer0.itdept.bsc.gov:7051 \
    -e CORE_PEER_LOCALMSPID=ITDeptMSP \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/itdept.bsc.gov/users/Admin@itdept.bsc.gov/msp \
    -e CORE_PEER_TLS_ROOTCERT_FILE=${ITDEPT_TLS} \
    bsc-cli peer "$@"
}

# Endorsement from 2 orgs satisfies MAJORITY (2 of 3)
ENDORSE_PEERS=(
  "--peerAddresses" "peer0.itdept.bsc.gov:7051"
  "--tlsRootCertFiles" "${ITDEPT_TLS}"
  "--peerAddresses" "peer0.registrar.bsc.gov:8051"
  "--tlsRootCertFiles" "${REGISTRAR_TLS}"
)

# ── Test 1: anomaly — CreateCitizenNode ──────────────────────────
echo ""
echo "→ Test 1: Creating a citizen node..."
cli_itdept chaincode invoke \
  -o ${ORDERER} --channelID ${CHANNEL} --name anomaly \
  --tls --cafile ${ORDERER_CA} \
  "${ENDORSE_PEERS[@]}" \
  --waitForEvent \
  -c '{"function":"CreateCitizenNode","Args":["abc123hash","pan456hash","Test Citizen","1990-01-01","Maharashtra","civilian","5000000000","2000000000","4000000000","3000000000"]}'
echo "   ✓ CreateCitizenNode OK"

# ── Test 2: anomaly — GetCitizenNode (query, no endorsement needed) ─
echo ""
echo "→ Test 2: Querying citizen node..."
cli_itdept chaincode query \
  --channelID ${CHANNEL} --name anomaly \
  -c '{"function":"GetCitizenNode","Args":["abc123hash"]}'
echo "   ✓ GetCitizenNode OK"

# ── Test 3: property — RegisterProperty ─────────────────────────
echo ""
echo "→ Test 3: Registering a property..."
cli_itdept chaincode invoke \
  -o ${ORDERER} --channelID ${CHANNEL} --name property \
  --tls --cafile ${ORDERER_CA} \
  "${ENDORSE_PEERS[@]}" \
  --waitForEvent \
  -c '{"function":"RegisterProperty","Args":["PROP001","abc123hash","REG-MH-2024-001","RESIDENTIAL","5000000","6000000","1200","Mumbai","Maharashtra","2024-01-15","PURCHASE","250000"]}'
echo "   ✓ RegisterProperty OK"

# ── Test 4: access — LogAccess ───────────────────────────────────
echo ""
echo "→ Test 4: Logging a data access event..."
cli_itdept chaincode invoke \
  -o ${ORDERER} --channelID ${CHANNEL} --name access \
  --tls --cafile ${ORDERER_CA} \
  "${ENDORSE_PEERS[@]}" \
  --waitForEvent \
  -c '{"function":"LogAccess","Args":["abc123hash","officer001hash","IT_DEPT","VIEW","[\"INCOME_SUMMARY\"]","Routine audit INV-2024-001"]}'
echo "   ✓ LogAccess OK"

# ── Test 5: anomaly — RunAnomalyCheck ────────────────────────────
echo ""
echo "→ Test 5: Running anomaly check..."
cli_itdept chaincode invoke \
  -o ${ORDERER} --channelID ${CHANNEL} --name anomaly \
  --tls --cafile ${ORDERER_CA} \
  "${ENDORSE_PEERS[@]}" \
  --waitForEvent \
  -c '{"function":"RunAnomalyCheck","Args":["abc123hash"]}'
echo "   ✓ RunAnomalyCheck OK"

echo ""
echo "============================================================"
echo " All smoke tests passed. Blockchain layer is fully live."
echo "============================================================"
