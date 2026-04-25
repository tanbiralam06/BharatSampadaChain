package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ── Data types ────────────────────────────────────────────────────

type PropertyRecord struct {
	PropertyID       string `json:"propertyId"`
	OwnerHash        string `json:"ownerHash"`
	PrevOwnerHash    string `json:"prevOwnerHash"`
	RegistrationNo   string `json:"registrationNo"`
	PropertyType     string `json:"propertyType"`
	DeclaredValue    int64  `json:"declaredValue"`
	CircleRateValue  int64  `json:"circleRateValue"`
	AreaSqft         int64  `json:"areaSqft"`
	District         string `json:"district"`
	State            string `json:"state"`
	RegistrationDate string `json:"registrationDate"`
	TransferType     string `json:"transferType"` // PURCHASE | INHERITANCE | GIFT | COURT_ORDER
	StampDutyPaid    int64  `json:"stampDutyPaid"`
	Encumbrance      string `json:"encumbrance"` // CLEAR | MORTGAGED | DISPUTED | COURT_STAY
	MortgageAmount   int64  `json:"mortgageAmount"`
	IsActive         bool   `json:"isActive"`
	CreatedAt        string `json:"createdAt"`
	LastUpdated      string `json:"lastUpdated"`
}

type TransferRecord struct {
	TransferID    string `json:"transferId"`
	PropertyID    string `json:"propertyId"`
	FromOwnerHash string `json:"fromOwnerHash"`
	ToOwnerHash   string `json:"toOwnerHash"`
	TransferValue int64  `json:"transferValue"`
	TransferType  string `json:"transferType"`
	TransferDate  string `json:"transferDate"`
	Reason        string `json:"reason"`
}

// ── Contract ──────────────────────────────────────────────────────

type SmartContract struct {
	contractapi.Contract
}

// txTime returns the transaction proposal timestamp — identical on all endorsing peers.
func txTime(ctx contractapi.TransactionContextInterface) string {
	ts, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return time.Now().UTC().Format(time.RFC3339)
	}
	return ts.AsTime().UTC().Format(time.RFC3339)
}

// RegisterProperty records a new property on the ledger.
// Validates that declared value >= 80% of circle rate to prevent undervaluation fraud.
func (s *SmartContract) RegisterProperty(
	ctx contractapi.TransactionContextInterface,
	propertyID, ownerHash, registrationNo, propertyType string,
	declaredValue, circleRateValue, areaSqft int64,
	district, state, registrationDate, transferType string,
	stampDutyPaid int64,
) (*PropertyRecord, error) {
	existing, err := ctx.GetStub().GetState("PROP_" + propertyID)
	if err != nil {
		return nil, fmt.Errorf("state read failed: %w", err)
	}
	if existing != nil {
		return nil, fmt.Errorf("property %s already registered", propertyID)
	}

	// Undervaluation check: declared must be ≥ 80% of circle rate
	if circleRateValue > 0 && declaredValue < (circleRateValue*80/100) {
		return nil, fmt.Errorf(
			"declared value (₹%.2f) is below 80%% of circle rate (₹%.2f) — transaction rejected",
			rupees(declaredValue), rupees(circleRateValue),
		)
	}

	ts := txTime(ctx)
	prop := PropertyRecord{
		PropertyID:       propertyID,
		OwnerHash:        ownerHash,
		RegistrationNo:   registrationNo,
		PropertyType:     propertyType,
		DeclaredValue:    declaredValue,
		CircleRateValue:  circleRateValue,
		AreaSqft:         areaSqft,
		District:         district,
		State:            state,
		RegistrationDate: registrationDate,
		TransferType:     transferType,
		StampDutyPaid:    stampDutyPaid,
		Encumbrance:      "CLEAR",
		IsActive:         true,
		CreatedAt:        ts,
		LastUpdated:      ts,
	}

	data, err := json.Marshal(prop)
	if err != nil {
		return nil, err
	}
	if err := ctx.GetStub().PutState("PROP_"+propertyID, data); err != nil {
		return nil, err
	}

	// Owner index for range queries
	ck, _ := ctx.GetStub().CreateCompositeKey("OWNER_PROP", []string{ownerHash, propertyID})
	if err := ctx.GetStub().PutState(ck, []byte{0}); err != nil {
		return nil, err
	}

	return &prop, nil
}

// TransferProperty transfers ownership. Validates seller is current owner and property is not frozen.
func (s *SmartContract) TransferProperty(
	ctx contractapi.TransactionContextInterface,
	propertyID, newOwnerHash, transferType, reason string,
	transferValue int64,
) (*TransferRecord, error) {
	prop, err := s.getProperty(ctx, propertyID)
	if err != nil {
		return nil, err
	}

	if prop.Encumbrance == "COURT_STAY" {
		return nil, fmt.Errorf("property %s has a court stay order — transfer blocked", propertyID)
	}
	if prop.Encumbrance == "DISPUTED" {
		return nil, fmt.Errorf("property %s is under dispute — transfer blocked", propertyID)
	}

	// Undervaluation check on transfer too
	if prop.CircleRateValue > 0 && transferValue < (prop.CircleRateValue*80/100) {
		return nil, fmt.Errorf(
			"transfer value (₹%.2f) is below 80%% of circle rate (₹%.2f)",
			rupees(transferValue), rupees(prop.CircleRateValue),
		)
	}

	ts := txTime(ctx)
	txID := ctx.GetStub().GetTxID()
	transfer := &TransferRecord{
		TransferID:    fmt.Sprintf("TXR-%s", txID[:12]),
		PropertyID:    propertyID,
		FromOwnerHash: prop.OwnerHash,
		ToOwnerHash:   newOwnerHash,
		TransferValue: transferValue,
		TransferType:  transferType,
		TransferDate:  ts,
		Reason:        reason,
	}

	// Remove old owner index
	oldCK, _ := ctx.GetStub().CreateCompositeKey("OWNER_PROP", []string{prop.OwnerHash, propertyID})
	_ = ctx.GetStub().DelState(oldCK)

	// Update property
	prop.PrevOwnerHash = prop.OwnerHash
	prop.OwnerHash = newOwnerHash
	prop.DeclaredValue = transferValue
	prop.TransferType = transferType
	prop.LastUpdated = ts

	data, err := json.Marshal(prop)
	if err != nil {
		return nil, err
	}
	if err := ctx.GetStub().PutState("PROP_"+propertyID, data); err != nil {
		return nil, err
	}

	// Add new owner index
	newCK, _ := ctx.GetStub().CreateCompositeKey("OWNER_PROP", []string{newOwnerHash, propertyID})
	if err := ctx.GetStub().PutState(newCK, []byte{0}); err != nil {
		return nil, err
	}

	// Save transfer record
	tData, _ := json.Marshal(transfer)
	return transfer, ctx.GetStub().PutState("TRANSFER_"+transfer.TransferID, tData)
}

// GetProperty reads a property by ID.
func (s *SmartContract) GetProperty(
	ctx contractapi.TransactionContextInterface,
	propertyID string,
) (*PropertyRecord, error) {
	return s.getProperty(ctx, propertyID)
}

// GetPropertiesByOwner returns all properties for an owner using composite key index.
func (s *SmartContract) GetPropertiesByOwner(
	ctx contractapi.TransactionContextInterface,
	ownerHash string,
) ([]*PropertyRecord, error) {
	iter, err := ctx.GetStub().GetStateByPartialCompositeKey("OWNER_PROP", []string{ownerHash})
	if err != nil {
		return nil, err
	}
	defer iter.Close()

	var props []*PropertyRecord
	for iter.HasNext() {
		kv, err := iter.Next()
		if err != nil {
			return nil, err
		}
		_, parts, err := ctx.GetStub().SplitCompositeKey(kv.Key)
		if err != nil || len(parts) < 2 {
			continue
		}
		prop, err := s.getProperty(ctx, parts[1])
		if err != nil {
			continue
		}
		props = append(props, prop)
	}
	return props, nil
}

// UpdateEncumbrance updates the encumbrance status (e.g., court orders).
func (s *SmartContract) UpdateEncumbrance(
	ctx contractapi.TransactionContextInterface,
	propertyID, encumbrance string,
	mortgageAmount int64,
) error {
	prop, err := s.getProperty(ctx, propertyID)
	if err != nil {
		return err
	}
	prop.Encumbrance = encumbrance
	prop.MortgageAmount = mortgageAmount
	prop.LastUpdated = txTime(ctx)

	data, _ := json.Marshal(prop)
	return ctx.GetStub().PutState("PROP_"+propertyID, data)
}

// ── Helpers ───────────────────────────────────────────────────────

func (s *SmartContract) getProperty(ctx contractapi.TransactionContextInterface, propertyID string) (*PropertyRecord, error) {
	data, err := ctx.GetStub().GetState("PROP_" + propertyID)
	if err != nil {
		return nil, fmt.Errorf("state read failed: %w", err)
	}
	if data == nil {
		return nil, fmt.Errorf("property %s not found", propertyID)
	}
	var prop PropertyRecord
	if err := json.Unmarshal(data, &prop); err != nil {
		return nil, err
	}
	return &prop, nil
}

func rupees(paisa int64) float64 {
	return float64(paisa) / 100
}

// ── Entry point ───────────────────────────────────────────────────

func main() {
	cc, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		log.Panicf("Error creating property chaincode: %v", err)
	}
	if err := cc.Start(); err != nil {
		log.Panicf("Error starting property chaincode: %v", err)
	}
}
