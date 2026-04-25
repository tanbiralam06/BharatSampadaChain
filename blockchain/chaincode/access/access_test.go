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
	stub := shimtest.NewMockStub("access", nil)
	ctx := &MockTransactionContext{stub: stub}
	ctx.nextTx()
	return ctx
}

const (
	citizenHash  = "aaaa1234567890abcdef1234567890abcdef1234567890abcdef1234567890aa"
	accessorHash = "bbbb1234567890abcdef1234567890abcdef1234567890abcdef1234567890bb"
)

// initAndCommit calls InitLedger and flushes the writes.
func initAndCommit(t *testing.T, sc *SmartContract, ctx *MockTransactionContext) {
	t.Helper()
	require.NoError(t, sc.InitLedger(ctx))
	ctx.nextTx()
}

// ── InitLedger ────────────────────────────────────────────────────────────────

func TestInitLedger(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)
	initAndCommit(t, sc, ctx)

	rule, err := sc.GetPermissionRule(ctx, "CITIZEN")
	require.NoError(t, err)
	assert.Equal(t, "CITIZEN", rule.AccessorRole)
	assert.Contains(t, rule.DataTypes, "ALL")
	assert.False(t, rule.RequiresRef)
}

func TestInitLedger_AllRolesSeeded(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)
	initAndCommit(t, sc, ctx)

	for _, role := range []string{"CITIZEN", "IT_DEPT", "ED", "CBI", "COURT", "BANK", "ADMIN", "PUBLIC"} {
		_, err := sc.GetPermissionRule(ctx, role)
		assert.NoError(t, err, "missing rule for role %s", role)
	}
}

// ── CheckPermission ───────────────────────────────────────────────────────────

func TestCheckPermission_Allowed(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)
	initAndCommit(t, sc, ctx)

	// IT_DEPT has INCOME_SUMMARY; RequiresRef=true so a ref is required
	ok, err := sc.CheckPermission(ctx, "IT_DEPT", "INCOME_SUMMARY", "case-ref-123")
	require.NoError(t, err)
	assert.True(t, ok)
}

func TestCheckPermission_DeniedMissingRef(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)
	initAndCommit(t, sc, ctx)

	ok, err := sc.CheckPermission(ctx, "IT_DEPT", "INCOME_SUMMARY", "")
	require.NoError(t, err)
	assert.False(t, ok)
}

func TestCheckPermission_UnknownRoleDenied(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)
	initAndCommit(t, sc, ctx)

	ok, err := sc.CheckPermission(ctx, "GHOST_ROLE", "ANY_DATA", "ref")
	require.NoError(t, err)
	assert.False(t, ok)
}

func TestCheckPermission_CITIZEN_AllAccess(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)
	initAndCommit(t, sc, ctx)

	// CITIZEN has ALL, RequiresRef=false — any data type and empty ref passes
	ok, err := sc.CheckPermission(ctx, "CITIZEN", "FULL_PROFILE", "")
	require.NoError(t, err)
	assert.True(t, ok)
}

func TestCheckPermission_DataTypeNotAllowed(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)
	initAndCommit(t, sc, ctx)

	// BANK only has CREDIT_SCORE; INCOME_SUMMARY must deny
	ok, err := sc.CheckPermission(ctx, "BANK", "INCOME_SUMMARY", "ref-123")
	require.NoError(t, err)
	assert.False(t, ok)
}

// ── LogAccess ─────────────────────────────────────────────────────────────────

func TestLogAccess_WritesCompositeKeys(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	logEntry, err := sc.LogAccess(ctx, citizenHash, accessorHash, "IT_DEPT", "VIEW",
		`["INCOME_SUMMARY"]`, "fraud investigation")
	require.NoError(t, err)
	assert.NotEmpty(t, logEntry.LogID)
	ctx.nextTx()

	raw, err := ctx.stub.GetState("ALOG_" + logEntry.LogID)
	require.NoError(t, err)
	assert.NotNil(t, raw)

	iter1, err := ctx.stub.GetStateByPartialCompositeKey("CITIZEN_LOG", []string{citizenHash})
	require.NoError(t, err)
	defer iter1.Close()
	assert.True(t, iter1.HasNext(), "CITIZEN_LOG composite key missing")

	iter2, err := ctx.stub.GetStateByPartialCompositeKey("ACCESSOR_LOG", []string{accessorHash})
	require.NoError(t, err)
	defer iter2.Close()
	assert.True(t, iter2.HasNext(), "ACCESSOR_LOG composite key missing")
}

func TestLogAccess_NonJSONDataTypeFallback(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	// Non-JSON string → stored as single-element slice, no error
	logEntry, err := sc.LogAccess(ctx, citizenHash, accessorHash, "ADMIN", "VIEW",
		"SYSTEM_METADATA", "admin check")
	require.NoError(t, err)
	assert.Equal(t, []string{"SYSTEM_METADATA"}, logEntry.DataTypes)
}

// ── GetAccessLogsByCitizen ────────────────────────────────────────────────────

func TestGetAccessLogsByCitizen(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	_, err := sc.LogAccess(ctx, citizenHash, accessorHash, "IT_DEPT", "VIEW",
		`["INCOME_SUMMARY"]`, "investigation 1")
	require.NoError(t, err)
	ctx.nextTx()

	_, err = sc.LogAccess(ctx, citizenHash, accessorHash, "CBI", "EXPORT",
		`["ALL"]`, "investigation 2")
	require.NoError(t, err)
	ctx.nextTx()

	logs, err := sc.GetAccessLogsByCitizen(ctx, citizenHash)
	require.NoError(t, err)
	assert.Len(t, logs, 2)
}

// ── GetAccessLogsByAccessor ───────────────────────────────────────────────────

func TestGetAccessLogsByAccessor(t *testing.T) {
	sc := &SmartContract{}
	ctx := newCtx(t)

	citizen2 := "cccc1234567890abcdef1234567890abcdef1234567890abcdef1234567890cc"

	_, err := sc.LogAccess(ctx, citizenHash, accessorHash, "IT_DEPT", "VIEW",
		`["INCOME_SUMMARY"]`, "case 1")
	require.NoError(t, err)
	ctx.nextTx()

	_, err = sc.LogAccess(ctx, citizen2, accessorHash, "IT_DEPT", "VIEW",
		`["ASSET_SUMMARY"]`, "case 2")
	require.NoError(t, err)
	ctx.nextTx()

	logs, err := sc.GetAccessLogsByAccessor(ctx, accessorHash)
	require.NoError(t, err)
	assert.Len(t, logs, 2)
}
