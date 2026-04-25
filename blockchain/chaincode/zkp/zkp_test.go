package main

import (
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-chaincode-go/shim/shimtest"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ── Test context ─────────────────────────────────────────────────────────────

type MockTransactionContext struct {
	contractapi.TransactionContext
	stub *shimtest.MockStub
	seq  int
}

func (m *MockTransactionContext) GetStub() shim.ChaincodeStubInterface {
	return m.stub
}

func (m *MockTransactionContext) nextTx() {
	if m.stub.TxID != "" {
		m.stub.MockTransactionEnd(m.stub.TxID)
	}
	m.seq++
	m.stub.MockTransactionStart(fmt.Sprintf("txid%032d", m.seq))
}

func newCtx(t *testing.T) *MockTransactionContext {
	t.Helper()
	stub := shimtest.NewMockStub("zkp", nil)
	ctx := &MockTransactionContext{stub: stub}
	ctx.nextTx()
	return ctx
}

const (
	citizenHash   = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
	queryType     = "INCOME_ABOVE_THRESHOLD"
	validProof    = `{"a":"1","b":"2","c":"3"}`
	validPublicIn = `{"signal":1}`
)

// ── SubmitProof ───────────────────────────────────────────────────────────────

func TestSubmitProof_ValidJSON(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	proof, err := sc.SubmitProof(ctx, citizenHash, queryType, validProof, validPublicIn, "officer-hash")
	require.NoError(t, err)
	assert.True(t, proof.IsVerified)
	assert.NotEmpty(t, proof.ProofID)
	assert.NotEmpty(t, proof.VerifiedAt)
	ctx.nextTx()

	raw, err := ctx.stub.GetState("ZKP_" + proof.ProofID)
	require.NoError(t, err)
	assert.NotNil(t, raw, "proof record not stored in state")

	claimID := "CLAIM-" + citizenHash[:8] + "-" + queryType
	claimRaw, err := ctx.stub.GetState("CLAIM_" + claimID)
	require.NoError(t, err)
	assert.NotNil(t, claimRaw, "VerifiedClaim not written to state")
}

func TestSubmitProof_EmptyProofRejected(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	_, err := sc.SubmitProof(ctx, citizenHash, queryType, "", validPublicIn, "officer")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "required")
}

func TestSubmitProof_EmptyPublicInputsRejected(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	_, err := sc.SubmitProof(ctx, citizenHash, queryType, validProof, "", "officer")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "required")
}

func TestSubmitProof_InvalidJSONReturnsUnverified(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	proof, err := sc.SubmitProof(ctx, citizenHash, queryType, "not-json", validPublicIn, "officer")
	require.NoError(t, err)
	assert.False(t, proof.IsVerified)
	assert.Empty(t, proof.VerifiedAt)
}

func TestSubmitProof_EmptyObjectIsUnverified(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	// Valid JSON but empty object — simulateVerification requires len(p) > 0
	proof, err := sc.SubmitProof(ctx, citizenHash, queryType, `{}`, validPublicIn, "officer")
	require.NoError(t, err)
	assert.False(t, proof.IsVerified)
}

// ── GetProof ──────────────────────────────────────────────────────────────────

func TestGetProof_Found(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	submitted, err := sc.SubmitProof(ctx, citizenHash, queryType, validProof, validPublicIn, "officer")
	require.NoError(t, err)
	ctx.nextTx()

	found, err := sc.GetProof(ctx, submitted.ProofID)
	require.NoError(t, err)
	assert.Equal(t, submitted.ProofID, found.ProofID)
	assert.Equal(t, citizenHash, found.CitizenHash)
}

func TestGetProof_NotFound(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	_, err := sc.GetProof(ctx, "nonexistent-proof-id")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
}

// ── GetVerifiedClaims ─────────────────────────────────────────────────────────

func TestGetVerifiedClaims_ReturnsActive(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	_, err := sc.SubmitProof(ctx, citizenHash, queryType, validProof, validPublicIn, "officer")
	require.NoError(t, err)
	ctx.nextTx()

	claims, err := sc.GetVerifiedClaims(ctx, citizenHash)
	require.NoError(t, err)
	assert.Len(t, claims, 1)
	assert.Equal(t, queryType, claims[0].ClaimType)
}

func TestGetVerifiedClaims_ExcludesExpired(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	_, err := sc.SubmitProof(ctx, citizenHash, queryType, validProof, validPublicIn, "officer")
	require.NoError(t, err)
	ctx.nextTx()

	// Directly overwrite ValidUntil with a past date in the committed mock state
	claimID := "CLAIM-" + citizenHash[:8] + "-" + queryType
	claimRaw := ctx.stub.State["CLAIM_"+claimID]
	require.NotNil(t, claimRaw)

	var claim VerifiedClaim
	require.NoError(t, json.Unmarshal(claimRaw, &claim))
	claim.ValidUntil = time.Date(2000, 1, 1, 0, 0, 0, 0, time.UTC).Format(time.RFC3339)
	updated, _ := json.Marshal(claim)
	ctx.stub.State["CLAIM_"+claimID] = updated

	claims, err := sc.GetVerifiedClaims(ctx, citizenHash)
	require.NoError(t, err)
	assert.Empty(t, claims, "expired claim must be excluded")
}

// ── GetProofsByQueryType ──────────────────────────────────────────────────────

func TestGetProofsByQueryType(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	_, err := sc.SubmitProof(ctx, citizenHash, queryType, validProof, validPublicIn, "officer")
	require.NoError(t, err)
	ctx.nextTx()

	_, err = sc.SubmitProof(ctx, citizenHash, queryType, validProof, validPublicIn, "officer")
	require.NoError(t, err)
	ctx.nextTx()

	proofs, err := sc.GetProofsByQueryType(ctx, citizenHash, queryType)
	require.NoError(t, err)
	assert.Len(t, proofs, 2)
}
