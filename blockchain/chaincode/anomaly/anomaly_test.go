package main

import (
	"encoding/json"
	"fmt"
	"testing"

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

// nextTx flushes pending writes to committed state and opens a new transaction.
// shimtest.MockStub stages PutState writes in a writeset; GetState only reads
// committed state. Call nextTx() between write and dependent read operations.
func (m *MockTransactionContext) nextTx() {
	if m.stub.TxID != "" {
		m.stub.MockTransactionEnd(m.stub.TxID)
	}
	m.seq++
	m.stub.MockTransactionStart(fmt.Sprintf("txid%032d", m.seq))
}

func newCtx(t *testing.T) *MockTransactionContext {
	t.Helper()
	stub := shimtest.NewMockStub("anomaly", nil)
	ctx := &MockTransactionContext{stub: stub}
	ctx.nextTx()
	return ctx
}

const testHash = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"

// createTestCitizen is a helper that creates a citizen and commits the write.
func createTestCitizen(t *testing.T, sc *SmartContract, ctx *MockTransactionContext,
	hash, citizenType string, totalAssets, income5yr, prevAssets, assets5yrAgo int64) {
	t.Helper()
	_, err := sc.CreateCitizenNode(ctx, hash, "panhash1234", "Test User",
		"1990-01-01", "Maharashtra", citizenType,
		totalAssets, income5yr, prevAssets, assets5yrAgo)
	require.NoError(t, err)
	ctx.nextTx() // flush citizen to committed state
}

// ── CreateCitizenNode ─────────────────────────────────────────────────────────

func TestCreateCitizenNode_Success(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	citizen, err := sc.CreateCitizenNode(ctx, testHash, "panhash1234", "Test User",
		"1990-01-01", "Maharashtra", "civilian",
		5_000_00000, 1_000_00000, 4_000_00000, 1_000_00000)
	require.NoError(t, err)
	assert.Equal(t, testHash, citizen.CitizenHash)
	assert.Equal(t, int64(5_000_00000), citizen.TotalDeclaredAssets)
	assert.Equal(t, 0, citizen.AnomalyScore)

	ctx.nextTx()
	raw, err := ctx.stub.GetState("CITIZEN_" + testHash)
	require.NoError(t, err)
	assert.NotNil(t, raw)
}

func TestCreateCitizenNode_DuplicateRejects(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	createTestCitizen(t, sc, ctx, testHash, "civilian", 1000, 1000, 1000, 1000)

	_, err := sc.CreateCitizenNode(ctx, testHash, "p", "A", "2000-01-01", "MH", "civilian",
		1000, 1000, 1000, 1000)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "already exists")
}

// ── GetCitizenNode ────────────────────────────────────────────────────────────

func TestGetCitizenNode_NotFound(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	_, err := sc.GetCitizenNode(ctx, testHash)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
}

// ── RunAnomalyCheck ───────────────────────────────────────────────────────────

func TestRunAnomalyCheck_NoFlags(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	// Assets exactly at the 5× income boundary — rule 1 must NOT fire
	createTestCitizen(t, sc, ctx, testHash, "civilian",
		10_000_00000, 2_000_00000, 9_000_00000, 9_000_00000)

	flags, err := sc.RunAnomalyCheck(ctx, testHash)
	require.NoError(t, err)
	assert.Empty(t, flags)
}

func TestRunAnomalyCheck_Rule1_YELLOW(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	// Assets (11 Cr) > 5 × income5yr (2 Cr = 10 Cr threshold) → YELLOW
	createTestCitizen(t, sc, ctx, testHash, "civilian",
		11_000_00000, 2_000_00000, 9_000_00000, 9_000_00000)

	flags, err := sc.RunAnomalyCheck(ctx, testHash)
	require.NoError(t, err)
	require.Len(t, flags, 1)
	assert.Equal(t, "YELLOW", flags[0].Severity)
	assert.Equal(t, "INCOME_ASSET_MISMATCH", flags[0].RuleTriggered)
}

func TestRunAnomalyCheck_Rule2_ORANGE(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	// annualIncome = 5Cr/5 = 1Cr; growth = 8Cr - 5Cr = 3Cr > 2×1Cr → ORANGE
	createTestCitizen(t, sc, ctx, testHash, "civilian",
		8_000_00000, 5_000_00000, 5_000_00000, 4_000_00000)

	flags, err := sc.RunAnomalyCheck(ctx, testHash)
	require.NoError(t, err)
	found := false
	for _, f := range flags {
		if f.Severity == "ORANGE" && f.RuleTriggered == "UNEXPLAINED_WEALTH" {
			found = true
		}
	}
	assert.True(t, found, "expected ORANGE UNEXPLAINED_WEALTH flag")
}

func TestRunAnomalyCheck_Rule3_RED(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	// govtOfficial: assets5YrAgo=1Cr, current=5Cr → 400% growth > 300% → RED
	createTestCitizen(t, sc, ctx, testHash, "government_official",
		5_000_00000, 1_000_00000, 4_000_00000, 1_000_00000)

	flags, err := sc.RunAnomalyCheck(ctx, testHash)
	require.NoError(t, err)
	found := false
	for _, f := range flags {
		if f.Severity == "RED" && f.RuleTriggered == "OFFICIAL_WEALTH_SURGE" {
			found = true
		}
	}
	assert.True(t, found, "expected RED OFFICIAL_WEALTH_SURGE flag")
}

func TestRunAnomalyCheck_Rule3_SkipsForCivilian(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	createTestCitizen(t, sc, ctx, testHash, "civilian",
		5_000_00000, 1_000_00000, 4_000_00000, 1_000_00000)

	flags, err := sc.RunAnomalyCheck(ctx, testHash)
	require.NoError(t, err)
	for _, f := range flags {
		assert.NotEqual(t, "OFFICIAL_WEALTH_SURGE", f.RuleTriggered,
			"OFFICIAL_WEALTH_SURGE must not fire for civilians")
	}
}

func TestRunAnomalyCheck_AnomalyScoreWritten(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	// RED rule → score must be 3
	createTestCitizen(t, sc, ctx, testHash, "government_official",
		5_000_00000, 1_000_00000, 4_000_00000, 1_000_00000)

	_, err := sc.RunAnomalyCheck(ctx, testHash)
	require.NoError(t, err)
	ctx.nextTx()

	citizen, err := sc.GetCitizenNode(ctx, testHash)
	require.NoError(t, err)
	assert.Equal(t, 3, citizen.AnomalyScore)
}

// ── SubmitManualFlag ──────────────────────────────────────────────────────────

func TestSubmitManualFlag_Success(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	flag, err := sc.SubmitManualFlag(ctx, testHash, "BENAMI_SUSPICION", "RED",
		"Proxy ownership detected", 5_000_00000, 500_00000, 4_500_00000)
	require.NoError(t, err)
	assert.Equal(t, "OPEN", flag.Status)
	assert.Equal(t, "RED", flag.Severity)
	assert.Equal(t, testHash, flag.CitizenHash)

	ctx.nextTx()
	raw, err := ctx.stub.GetState("FLAG_" + flag.FlagID)
	require.NoError(t, err)
	assert.NotNil(t, raw)
}

// ── UpdateFlagStatus ──────────────────────────────────────────────────────────

func TestUpdateFlagStatus_Cleared(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	flag, err := sc.SubmitManualFlag(ctx, testHash, "TEST_RULE", "YELLOW",
		"desc", 1000, 500, 500)
	require.NoError(t, err)
	ctx.nextTx()

	err = sc.UpdateFlagStatus(ctx, flag.FlagID, "CLEARED", "No evidence found")
	require.NoError(t, err)
	ctx.nextTx()

	raw, err := ctx.stub.GetState("FLAG_" + flag.FlagID)
	require.NoError(t, err)
	var updated AnomalyFlag
	require.NoError(t, json.Unmarshal(raw, &updated))
	assert.Equal(t, "CLEARED", updated.Status)
	assert.NotEmpty(t, updated.ResolvedAt)
}

// ── GetFlagsByCitizen ─────────────────────────────────────────────────────────

func TestGetFlagsByCitizen(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	_, err := sc.SubmitManualFlag(ctx, testHash, "RULE_A", "YELLOW", "desc", 1000, 500, 500)
	require.NoError(t, err)
	ctx.nextTx()

	_, err = sc.SubmitManualFlag(ctx, testHash, "RULE_B", "ORANGE", "desc", 2000, 500, 1500)
	require.NoError(t, err)
	ctx.nextTx()

	flags, err := sc.GetFlagsByCitizen(ctx, testHash)
	require.NoError(t, err)
	assert.Len(t, flags, 2)
}

// ── Edge cases ────────────────────────────────────────────────────────────────

func TestRuleIncomeAssetMismatch_ZeroIncome(t *testing.T) {
	sc := &SmartContract{}
	citizen := &CitizenNode{
		CitizenHash:         testHash,
		TotalDeclaredAssets: 999_999_99999,
		TotalIncome5Yr:      0,
	}
	flag := sc.ruleIncomeAssetMismatch(citizen, "2024-01-01T00:00:00Z")
	assert.Nil(t, flag, "zero income must not trigger YELLOW flag")
}
