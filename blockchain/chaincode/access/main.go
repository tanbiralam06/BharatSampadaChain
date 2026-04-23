package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ── Data types ────────────────────────────────────────────────────

type AccessLog struct {
	LogID           string   `json:"logId"`
	CitizenHash     string   `json:"citizenHash"` // whose data was accessed
	AccessorHash    string   `json:"accessorHash"`
	AccessorRole    string   `json:"accessorRole"` // CITIZEN | IT_DEPT | ED | CBI | COURT | BANK | ADMIN
	AccessType      string   `json:"accessType"`   // VIEW | EXPORT | FLAG_RAISED | FLAG_CLEARED | FULL_DISCLOSURE
	DataTypes       []string `json:"dataTypes"`    // which fields were accessed
	Purpose         string   `json:"purpose"`
	AuthorizationRef string  `json:"authorizationRef,omitempty"` // investigation/court order number
	Timestamp       string   `json:"timestamp"`
	TxID            string   `json:"txId"`
}

// Permission matrix entry — stored on-chain so it can be audited and updated via governance
type PermissionRule struct {
	AccessorRole string   `json:"accessorRole"`
	DataTypes    []string `json:"allowedDataTypes"`
	RequiresRef  bool     `json:"requiresAuthorizationRef"`
}

// ── Contract ──────────────────────────────────────────────────────

type SmartContract struct {
	contractapi.Contract
}

func now() string {
	return time.Now().UTC().Format(time.RFC3339)
}

// InitLedger seeds the permission matrix with the BSC access control rules.
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	rules := []PermissionRule{
		{AccessorRole: "CITIZEN", DataTypes: []string{"ALL"}, RequiresRef: false},
		{AccessorRole: "IT_DEPT", DataTypes: []string{"INCOME_SUMMARY", "ASSET_SUMMARY", "ANOMALY_STATUS"}, RequiresRef: true},
		{AccessorRole: "ED", DataTypes: []string{"INCOME_SUMMARY", "ASSET_SUMMARY", "PROPERTY_LIST", "BUSINESS_HOLDINGS"}, RequiresRef: true},
		{AccessorRole: "CBI", DataTypes: []string{"ALL"}, RequiresRef: true},
		{AccessorRole: "COURT", DataTypes: []string{"ALL"}, RequiresRef: true},
		{AccessorRole: "BANK", DataTypes: []string{"CREDIT_SCORE"}, RequiresRef: true},
		{AccessorRole: "ADMIN", DataTypes: []string{"SYSTEM_METADATA"}, RequiresRef: false},
		{AccessorRole: "PUBLIC", DataTypes: []string{"OFFICIAL_WEALTH_SUMMARY"}, RequiresRef: false},
	}

	for _, rule := range rules {
		data, err := json.Marshal(rule)
		if err != nil {
			return err
		}
		if err := ctx.GetStub().PutState("PERM_"+rule.AccessorRole, data); err != nil {
			return err
		}
	}
	return nil
}

// CheckPermission evaluates whether an accessor role may access a given data type.
// Returns true if permitted. Every call must be followed by LogAccess to create an audit trail.
func (s *SmartContract) CheckPermission(
	ctx contractapi.TransactionContextInterface,
	accessorRole, dataType, authorizationRef string,
) (bool, error) {
	rule, err := s.getPermissionRule(ctx, accessorRole)
	if err != nil {
		// Unknown role → deny
		return false, nil
	}

	if rule.RequiresRef && authorizationRef == "" {
		return false, nil
	}

	for _, allowed := range rule.DataTypes {
		if allowed == "ALL" || allowed == dataType {
			return true, nil
		}
	}
	return false, nil
}

// LogAccess writes an immutable access log entry. Called after every data access.
func (s *SmartContract) LogAccess(
	ctx contractapi.TransactionContextInterface,
	citizenHash, accessorHash, accessorRole, accessType, dataTypesJSON, purpose string,
) (*AccessLog, error) {
	txID := ctx.GetStub().GetTxID()
	timestamp := now()

	var dataTypes []string
	if err := json.Unmarshal([]byte(dataTypesJSON), &dataTypes); err != nil {
		// Accept a single string if not JSON array
		dataTypes = []string{dataTypesJSON}
	}

	logEntry := AccessLog{
		LogID:        fmt.Sprintf("LOG-%s", txID[:16]),
		CitizenHash:  citizenHash,
		AccessorHash: accessorHash,
		AccessorRole: accessorRole,
		AccessType:   accessType,
		DataTypes:    dataTypes,
		Purpose:      purpose,
		Timestamp:    timestamp,
		TxID:         txID,
	}

	data, err := json.Marshal(logEntry)
	if err != nil {
		return nil, err
	}
	if err := ctx.GetStub().PutState("ALOG_"+logEntry.LogID, data); err != nil {
		return nil, err
	}

	// Index: by citizen (to show citizen who accessed their data)
	ck1, _ := ctx.GetStub().CreateCompositeKey("CITIZEN_LOG", []string{citizenHash, timestamp, logEntry.LogID})
	if err := ctx.GetStub().PutState(ck1, []byte{0}); err != nil {
		return nil, err
	}

	// Index: by accessor (audit trail per officer)
	ck2, _ := ctx.GetStub().CreateCompositeKey("ACCESSOR_LOG", []string{accessorHash, timestamp, logEntry.LogID})
	if err := ctx.GetStub().PutState(ck2, []byte{0}); err != nil {
		return nil, err
	}

	return &logEntry, nil
}

// GetAccessLogsByCitizen returns the access history for a citizen (who looked at their data).
func (s *SmartContract) GetAccessLogsByCitizen(
	ctx contractapi.TransactionContextInterface,
	citizenHash string,
) ([]*AccessLog, error) {
	return s.queryLogsByIndex(ctx, "CITIZEN_LOG", citizenHash)
}

// GetAccessLogsByAccessor returns all access events performed by a given officer/accessor.
func (s *SmartContract) GetAccessLogsByAccessor(
	ctx contractapi.TransactionContextInterface,
	accessorHash string,
) ([]*AccessLog, error) {
	return s.queryLogsByIndex(ctx, "ACCESSOR_LOG", accessorHash)
}

// GetPermissionRule returns the current permission matrix entry for a role.
func (s *SmartContract) GetPermissionRule(
	ctx contractapi.TransactionContextInterface,
	accessorRole string,
) (*PermissionRule, error) {
	return s.getPermissionRule(ctx, accessorRole)
}

// ── Helpers ───────────────────────────────────────────────────────

func (s *SmartContract) getPermissionRule(ctx contractapi.TransactionContextInterface, role string) (*PermissionRule, error) {
	data, err := ctx.GetStub().GetState("PERM_" + role)
	if err != nil {
		return nil, fmt.Errorf("state read failed: %w", err)
	}
	if data == nil {
		return nil, fmt.Errorf("no permission rule for role: %s", role)
	}
	var rule PermissionRule
	if err := json.Unmarshal(data, &rule); err != nil {
		return nil, err
	}
	return &rule, nil
}

func (s *SmartContract) queryLogsByIndex(ctx contractapi.TransactionContextInterface, indexName, key string) ([]*AccessLog, error) {
	iter, err := ctx.GetStub().GetStateByPartialCompositeKey(indexName, []string{key})
	if err != nil {
		return nil, err
	}
	defer iter.Close()

	var logs []*AccessLog
	for iter.HasNext() {
		kv, err := iter.Next()
		if err != nil {
			return nil, err
		}
		_, parts, err := ctx.GetStub().SplitCompositeKey(kv.Key)
		if err != nil || len(parts) < 3 {
			continue
		}
		logData, err := ctx.GetStub().GetState("ALOG_" + parts[2])
		if err != nil || logData == nil {
			continue
		}
		var entry AccessLog
		if err := json.Unmarshal(logData, &entry); err != nil {
			continue
		}
		logs = append(logs, &entry)
	}
	return logs, nil
}

// ── Entry point ───────────────────────────────────────────────────

func main() {
	cc, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		log.Panicf("Error creating access chaincode: %v", err)
	}
	if err := cc.Start(); err != nil {
		log.Panicf("Error starting access chaincode: %v", err)
	}
}
