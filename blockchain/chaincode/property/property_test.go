package main

import (
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

func (m *MockTransactionContext) nextTx() {
	if m.stub.TxID != "" {
		m.stub.MockTransactionEnd(m.stub.TxID)
	}
	m.seq++
	m.stub.MockTransactionStart(fmt.Sprintf("txid%032d", m.seq))
}

func newCtx(t *testing.T) *MockTransactionContext {
	t.Helper()
	stub := shimtest.NewMockStub("property", nil)
	ctx := &MockTransactionContext{stub: stub}
	ctx.nextTx()
	return ctx
}

const (
	testOwner  = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
	testPropID = "PROP-MH-001"
	newOwner   = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
)

// registerAndCommit registers a property and flushes the write.
func registerAndCommit(t *testing.T, sc *SmartContract, ctx *MockTransactionContext,
	propID, ownerHash string, declaredValue, circleRateValue int64) {
	t.Helper()
	_, err := sc.RegisterProperty(ctx, propID, ownerHash, "REG-001", "residential",
		declaredValue, circleRateValue, 1200,
		"Mumbai", "Maharashtra", "2024-01-01", "PURCHASE", 500_000)
	require.NoError(t, err)
	ctx.nextTx()
}

// ── RegisterProperty ──────────────────────────────────────────────────────────

func TestRegisterProperty_Success(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	// declaredValue = 85% of circleRateValue (≥ 80% threshold — must pass)
	prop, err := sc.RegisterProperty(ctx, testPropID, testOwner, "REG-001", "residential",
		85_000_00000, 100_000_00000, 1200,
		"Mumbai", "Maharashtra", "2024-01-01", "PURCHASE", 500_000)
	require.NoError(t, err)
	assert.Equal(t, testPropID, prop.PropertyID)
	assert.Equal(t, "CLEAR", prop.Encumbrance)
	assert.True(t, prop.IsActive)
}

func TestRegisterProperty_Duplicate(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	registerAndCommit(t, sc, ctx, testPropID, testOwner, 90_000_00000, 100_000_00000)

	_, err := sc.RegisterProperty(ctx, testPropID, testOwner, "REG-002", "residential",
		90_000_00000, 100_000_00000, 1200,
		"Mumbai", "Maharashtra", "2024-01-01", "PURCHASE", 500_000)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "already registered")
}

func TestRegisterProperty_UndervaluationRejected(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	// declaredValue = 75% of circleRateValue (< 80% — must reject)
	_, err := sc.RegisterProperty(ctx, testPropID, testOwner, "REG-001", "residential",
		75_000_00000, 100_000_00000, 1200,
		"Mumbai", "Maharashtra", "2024-01-01", "PURCHASE", 500_000)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "below 80%")
}

func TestRegisterProperty_ZeroCircleRate(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	// circleRateValue = 0 means no rate data — undervaluation check skipped
	_, err := sc.RegisterProperty(ctx, testPropID, testOwner, "REG-001", "residential",
		10_000_00000, 0, 1200,
		"Mumbai", "Maharashtra", "2024-01-01", "PURCHASE", 500_000)
	require.NoError(t, err)
}

// ── TransferProperty ──────────────────────────────────────────────────────────

func TestTransferProperty_Success(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	registerAndCommit(t, sc, ctx, testPropID, testOwner, 90_000_00000, 100_000_00000)

	transfer, err := sc.TransferProperty(ctx, testPropID, newOwner, "PURCHASE", "sale", 90_000_00000)
	require.NoError(t, err)
	assert.Equal(t, newOwner, transfer.ToOwnerHash)
	assert.Equal(t, testOwner, transfer.FromOwnerHash)
	ctx.nextTx()

	prop, err := sc.GetProperty(ctx, testPropID)
	require.NoError(t, err)
	assert.Equal(t, newOwner, prop.OwnerHash)
	assert.Equal(t, testOwner, prop.PrevOwnerHash)
}

func TestTransferProperty_CourtStayBlocked(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	registerAndCommit(t, sc, ctx, testPropID, testOwner, 90_000_00000, 100_000_00000)
	require.NoError(t, sc.UpdateEncumbrance(ctx, testPropID, "COURT_STAY", 0))
	ctx.nextTx()

	_, err := sc.TransferProperty(ctx, testPropID, newOwner, "PURCHASE", "sale", 90_000_00000)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "court stay")
}

func TestTransferProperty_DisputedBlocked(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	registerAndCommit(t, sc, ctx, testPropID, testOwner, 90_000_00000, 100_000_00000)
	require.NoError(t, sc.UpdateEncumbrance(ctx, testPropID, "DISPUTED", 0))
	ctx.nextTx()

	_, err := sc.TransferProperty(ctx, testPropID, newOwner, "PURCHASE", "sale", 90_000_00000)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "dispute")
}

func TestTransferProperty_UndervaluationBlocked(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	registerAndCommit(t, sc, ctx, testPropID, testOwner, 90_000_00000, 100_000_00000)

	// Transfer at 70% of circle rate (< 80%) — must reject
	_, err := sc.TransferProperty(ctx, testPropID, newOwner, "PURCHASE", "sale", 70_000_00000)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "below 80%")
}

// ── GetProperty ───────────────────────────────────────────────────────────────

func TestGetProperty_NotFound(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	_, err := sc.GetProperty(ctx, "nonexistent")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
}

// ── GetPropertiesByOwner ──────────────────────────────────────────────────────

func TestGetPropertiesByOwner(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	registerAndCommit(t, sc, ctx, "PROP-001", testOwner, 90_000_00000, 100_000_00000)
	registerAndCommit(t, sc, ctx, "PROP-002", testOwner, 85_000_00000, 100_000_00000)

	props, err := sc.GetPropertiesByOwner(ctx, testOwner)
	require.NoError(t, err)
	assert.Len(t, props, 2)
}

// ── UpdateEncumbrance ─────────────────────────────────────────────────────────

func TestUpdateEncumbrance(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	registerAndCommit(t, sc, ctx, testPropID, testOwner, 90_000_00000, 100_000_00000)

	err := sc.UpdateEncumbrance(ctx, testPropID, "MORTGAGED", 50_000_00000)
	require.NoError(t, err)
	ctx.nextTx()

	prop, err := sc.GetProperty(ctx, testPropID)
	require.NoError(t, err)
	assert.Equal(t, "MORTGAGED", prop.Encumbrance)
	assert.Equal(t, int64(50_000_00000), prop.MortgageAmount)
}

// ── FreezeProperty ────────────────────────────────────────────────────────────

func TestFreezeProperty_Success(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	registerAndCommit(t, sc, ctx, testPropID, testOwner, 90_000_00000, 100_000_00000)

	prop, err := sc.FreezeProperty(ctx, testPropID, testOwner, "HC/2024/CR-001", "Asset attachment order")
	require.NoError(t, err)
	assert.Equal(t, "COURT_STAY", prop.Encumbrance)

	ctx.nextTx()

	// Verify persisted
	prop, err = sc.GetProperty(ctx, testPropID)
	require.NoError(t, err)
	assert.Equal(t, "COURT_STAY", prop.Encumbrance)
}

func TestFreezeProperty_AlreadyFrozen(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	registerAndCommit(t, sc, ctx, testPropID, testOwner, 90_000_00000, 100_000_00000)

	_, err := sc.FreezeProperty(ctx, testPropID, testOwner, "HC/2024/CR-001", "First freeze")
	require.NoError(t, err)
	ctx.nextTx()

	_, err = sc.FreezeProperty(ctx, testPropID, testOwner, "HC/2024/CR-002", "Second freeze attempt")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "already frozen")
}

func TestFreezeProperty_BlocksTransfer(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	registerAndCommit(t, sc, ctx, testPropID, testOwner, 90_000_00000, 100_000_00000)
	_, err := sc.FreezeProperty(ctx, testPropID, testOwner, "HC/2024/CR-001", "Freeze")
	require.NoError(t, err)
	ctx.nextTx()

	_, err = sc.TransferProperty(ctx, testPropID, newOwner, "PURCHASE", "sale", 90_000_00000)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "court stay")
}

// ── UnfreezeProperty ──────────────────────────────────────────────────────────

func TestUnfreezeProperty_Success(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	registerAndCommit(t, sc, ctx, testPropID, testOwner, 90_000_00000, 100_000_00000)

	_, err := sc.FreezeProperty(ctx, testPropID, testOwner, "HC/2024/CR-001", "Freeze")
	require.NoError(t, err)
	ctx.nextTx()

	prop, err := sc.UnfreezeProperty(ctx, testPropID, testOwner, "HC/2024/CR-001", "Order lifted by court")
	require.NoError(t, err)
	assert.Equal(t, "CLEAR", prop.Encumbrance)

	ctx.nextTx()

	// Transfer must succeed again
	_, err = sc.TransferProperty(ctx, testPropID, newOwner, "PURCHASE", "sale", 90_000_00000)
	require.NoError(t, err)
}

func TestUnfreezeProperty_NotFrozen(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	registerAndCommit(t, sc, ctx, testPropID, testOwner, 90_000_00000, 100_000_00000)

	_, err := sc.UnfreezeProperty(ctx, testPropID, testOwner, "HC/2024/CR-001", "Lift")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "not frozen")
}

// ── GetCourtOrders ────────────────────────────────────────────────────────────

func TestGetCourtOrders_EmptyInitially(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	registerAndCommit(t, sc, ctx, testPropID, testOwner, 90_000_00000, 100_000_00000)

	orders, err := sc.GetCourtOrders(ctx, testPropID)
	require.NoError(t, err)
	assert.Empty(t, orders)
}

func TestGetCourtOrders_RecordsHistory(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	registerAndCommit(t, sc, ctx, testPropID, testOwner, 90_000_00000, 100_000_00000)

	_, err := sc.FreezeProperty(ctx, testPropID, testOwner, "HC/2024/CR-001", "Freeze reason")
	require.NoError(t, err)
	ctx.nextTx()

	_, err = sc.UnfreezeProperty(ctx, testPropID, testOwner, "HC/2024/CR-001", "Lift reason")
	require.NoError(t, err)
	ctx.nextTx()

	orders, err := sc.GetCourtOrders(ctx, testPropID)
	require.NoError(t, err)
	assert.Len(t, orders, 2)

	// Find FREEZE and UNFREEZE orders
	types := map[string]bool{}
	for _, o := range orders {
		types[o.OrderType] = true
		assert.Equal(t, testPropID, o.PropertyID)
		assert.Equal(t, "HC/2024/CR-001", o.OrderRef)
	}
	assert.True(t, types["FREEZE"],   "should have a FREEZE order")
	assert.True(t, types["UNFREEZE"], "should have an UNFREEZE order")
}
