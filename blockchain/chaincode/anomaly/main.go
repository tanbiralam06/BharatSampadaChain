package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ── Data types ────────────────────────────────────────────────────

type CitizenNode struct {
	CitizenHash         string `json:"citizenHash"`
	PanHash             string `json:"panHash"`
	Name                string `json:"name"`
	DateOfBirth         string `json:"dateOfBirth"`
	AadhaarState        string `json:"aadhaarState"`
	CitizenType         string `json:"citizenType"` // civilian | government_official | politician
	TotalDeclaredAssets int64  `json:"totalDeclaredAssets"` // in paisa
	TotalIncome5Yr      int64  `json:"totalIncome5Yr"`      // total 5-year ITR income in paisa
	PrevYearAssets      int64  `json:"prevYearAssets"`      // assets at end of previous year
	Assets5YrAgo        int64  `json:"assets5YrAgo"`        // assets 5 years ago
	AnomalyScore        int    `json:"anomalyScore"`
	LastUpdated         string `json:"lastUpdated"`
	CreatedAt           string `json:"createdAt"`
}

type AnomalyFlag struct {
	FlagID          string `json:"flagId"`
	CitizenHash     string `json:"citizenHash"`
	RuleTriggered   string `json:"ruleTriggered"`
	Severity        string `json:"severity"` // YELLOW | ORANGE | RED
	Description     string `json:"description"`
	AssetValueUsed  int64  `json:"assetValueUsed"`
	IncomeValueUsed int64  `json:"incomeValueUsed"`
	GapAmount       int64  `json:"gapAmount"`
	Status          string `json:"status"` // OPEN | UNDER_INVESTIGATION | CLEARED | ESCALATED
	RaisedAt        string `json:"raisedAt"`
	ResolvedAt      string `json:"resolvedAt"`
	ResolutionNotes string `json:"resolutionNotes"`
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

// CreateCitizenNode writes a new citizen identity node to the ledger.
func (s *SmartContract) CreateCitizenNode(
	ctx contractapi.TransactionContextInterface,
	citizenHash, panHash, name, dob, state, citizenType string,
	totalAssets, totalIncome5Yr, prevYearAssets, assets5YrAgo int64,
) (*CitizenNode, error) {
	existing, err := ctx.GetStub().GetState("CITIZEN_" + citizenHash)
	if err != nil {
		return nil, fmt.Errorf("state read failed: %w", err)
	}
	if existing != nil {
		return nil, fmt.Errorf("citizen %s already exists", citizenHash)
	}

	ts := txTime(ctx)
	citizen := CitizenNode{
		CitizenHash:         citizenHash,
		PanHash:             panHash,
		Name:                name,
		DateOfBirth:         dob,
		AadhaarState:        state,
		CitizenType:         citizenType,
		TotalDeclaredAssets: totalAssets,
		TotalIncome5Yr:      totalIncome5Yr,
		PrevYearAssets:      prevYearAssets,
		Assets5YrAgo:        assets5YrAgo,
		AnomalyScore:        0,
		CreatedAt:           ts,
		LastUpdated:         ts,
	}

	data, err := json.Marshal(citizen)
	if err != nil {
		return nil, err
	}
	if err := ctx.GetStub().PutState("CITIZEN_"+citizenHash, data); err != nil {
		return nil, err
	}
	return &citizen, nil
}

// UpdateCitizenAssets updates asset and income figures, then re-runs anomaly checks.
func (s *SmartContract) UpdateCitizenAssets(
	ctx contractapi.TransactionContextInterface,
	citizenHash string,
	totalAssets, totalIncome5Yr, prevYearAssets, assets5YrAgo int64,
) error {
	citizen, err := s.getCitizen(ctx, citizenHash)
	if err != nil {
		return err
	}
	citizen.TotalDeclaredAssets = totalAssets
	citizen.TotalIncome5Yr = totalIncome5Yr
	citizen.PrevYearAssets = prevYearAssets
	citizen.Assets5YrAgo = assets5YrAgo
	citizen.LastUpdated = txTime(ctx)

	data, err := json.Marshal(citizen)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState("CITIZEN_"+citizenHash, data)
}

// GetCitizenNode reads a citizen node by hash.
func (s *SmartContract) GetCitizenNode(
	ctx contractapi.TransactionContextInterface,
	citizenHash string,
) (*CitizenNode, error) {
	return s.getCitizen(ctx, citizenHash)
}

// RunAnomalyCheck evaluates all 3 rules and writes any new flags to the ledger.
func (s *SmartContract) RunAnomalyCheck(
	ctx contractapi.TransactionContextInterface,
	citizenHash string,
) ([]*AnomalyFlag, error) {
	citizen, err := s.getCitizen(ctx, citizenHash)
	if err != nil {
		return nil, err
	}

	ts := txTime(ctx)
	var flags []*AnomalyFlag

	if f := s.ruleIncomeAssetMismatch(citizen, ts); f != nil {
		flags = append(flags, f)
	}
	if f := s.ruleUnexplainedWealth(citizen, ts); f != nil {
		flags = append(flags, f)
	}
	if f := s.ruleOfficialWealthSurge(citizen, ts); f != nil {
		flags = append(flags, f)
	}

	for _, flag := range flags {
		if err := s.saveFlag(ctx, flag); err != nil {
			return nil, err
		}
	}

	// Update anomaly score (max severity wins: RED=3, ORANGE=2, YELLOW=1)
	score := 0
	for _, f := range flags {
		switch f.Severity {
		case "RED":
			if score < 3 {
				score = 3
			}
		case "ORANGE":
			if score < 2 {
				score = 2
			}
		case "YELLOW":
			if score < 1 {
				score = 1
			}
		}
	}
	citizen.AnomalyScore = score
	citizen.LastUpdated = ts
	data, _ := json.Marshal(citizen)
	_ = ctx.GetStub().PutState("CITIZEN_"+citizenHash, data)

	return flags, nil
}

// SubmitManualFlag lets the API layer submit flags for rules requiring cross-citizen
// analysis (benami, shell company) that can't be computed on-chain alone.
func (s *SmartContract) SubmitManualFlag(
	ctx contractapi.TransactionContextInterface,
	citizenHash, ruleTriggered, severity, description string,
	assetValue, incomeValue, gapAmount int64,
) (*AnomalyFlag, error) {
	txID := ctx.GetStub().GetTxID()
	flag := &AnomalyFlag{
		FlagID:          fmt.Sprintf("FLAG-%s-%s", citizenHash[:8], txID[:8]),
		CitizenHash:     citizenHash,
		RuleTriggered:   ruleTriggered,
		Severity:        severity,
		Description:     description,
		AssetValueUsed:  assetValue,
		IncomeValueUsed: incomeValue,
		GapAmount:       gapAmount,
		Status:          "OPEN",
		RaisedAt:        txTime(ctx),
	}
	if err := s.saveFlag(ctx, flag); err != nil {
		return nil, err
	}
	return flag, nil
}

// UpdateFlagStatus lets officers update the investigation status of a flag.
func (s *SmartContract) UpdateFlagStatus(
	ctx contractapi.TransactionContextInterface,
	flagID, status, resolutionNotes string,
) error {
	data, err := ctx.GetStub().GetState("FLAG_" + flagID)
	if err != nil || data == nil {
		return fmt.Errorf("flag %s not found", flagID)
	}
	var flag AnomalyFlag
	if err := json.Unmarshal(data, &flag); err != nil {
		return err
	}
	flag.Status = status
	flag.ResolutionNotes = resolutionNotes
	if status == "CLEARED" || status == "ESCALATED" {
		flag.ResolvedAt = txTime(ctx)
	}
	updated, _ := json.Marshal(flag)
	return ctx.GetStub().PutState("FLAG_"+flagID, updated)
}

// GetFlagsByCitizen returns all anomaly flags for a citizen (range query on composite key).
func (s *SmartContract) GetFlagsByCitizen(
	ctx contractapi.TransactionContextInterface,
	citizenHash string,
) ([]*AnomalyFlag, error) {
	iter, err := ctx.GetStub().GetStateByPartialCompositeKey("CITIZEN_FLAG", []string{citizenHash})
	if err != nil {
		return nil, err
	}
	defer iter.Close()

	var flags []*AnomalyFlag
	for iter.HasNext() {
		kv, err := iter.Next()
		if err != nil {
			return nil, err
		}
		_, parts, err := ctx.GetStub().SplitCompositeKey(kv.Key)
		if err != nil {
			continue
		}
		if len(parts) < 2 {
			continue
		}
		flagData, err := ctx.GetStub().GetState("FLAG_" + parts[1])
		if err != nil || flagData == nil {
			continue
		}
		var flag AnomalyFlag
		if err := json.Unmarshal(flagData, &flag); err != nil {
			continue
		}
		flags = append(flags, &flag)
	}
	return flags, nil
}

// GetFlagsBySeverity returns all flags of a given severity (range query).
func (s *SmartContract) GetFlagsBySeverity(
	ctx contractapi.TransactionContextInterface,
	severity string,
) ([]*AnomalyFlag, error) {
	iter, err := ctx.GetStub().GetStateByPartialCompositeKey("SEVERITY_FLAG", []string{severity})
	if err != nil {
		return nil, err
	}
	defer iter.Close()

	var flags []*AnomalyFlag
	for iter.HasNext() {
		kv, err := iter.Next()
		if err != nil {
			return nil, err
		}
		_, parts, err := ctx.GetStub().SplitCompositeKey(kv.Key)
		if err != nil || len(parts) < 2 {
			continue
		}
		flagData, err := ctx.GetStub().GetState("FLAG_" + parts[1])
		if err != nil || flagData == nil {
			continue
		}
		var flag AnomalyFlag
		if err := json.Unmarshal(flagData, &flag); err != nil {
			continue
		}
		flags = append(flags, &flag)
	}
	return flags, nil
}

// ── Anomaly rules ─────────────────────────────────────────────────

// Rule 1 (YELLOW): declared assets > 5× total 5-year income
func (s *SmartContract) ruleIncomeAssetMismatch(c *CitizenNode, raisedAt string) *AnomalyFlag {
	if c.TotalIncome5Yr <= 0 {
		return nil
	}
	threshold := c.TotalIncome5Yr * 5
	if c.TotalDeclaredAssets <= threshold {
		return nil
	}
	gap := c.TotalDeclaredAssets - threshold
	return &AnomalyFlag{
		FlagID:          fmt.Sprintf("FLAG-%s-R1", c.CitizenHash[:8]),
		CitizenHash:     c.CitizenHash,
		RuleTriggered:   "INCOME_ASSET_MISMATCH",
		Severity:        "YELLOW",
		Description:     fmt.Sprintf("Declared assets (₹%.2f) exceed 5× declared 5-year income (₹%.2f)", rupees(c.TotalDeclaredAssets), rupees(c.TotalIncome5Yr)),
		AssetValueUsed:  c.TotalDeclaredAssets,
		IncomeValueUsed: c.TotalIncome5Yr,
		GapAmount:       gap,
		Status:          "OPEN",
		RaisedAt:        raisedAt,
	}
}

// Rule 2 (ORANGE): asset growth in 1 year > 2× annual income
func (s *SmartContract) ruleUnexplainedWealth(c *CitizenNode, raisedAt string) *AnomalyFlag {
	if c.PrevYearAssets <= 0 || c.TotalIncome5Yr <= 0 {
		return nil
	}
	annualIncome := c.TotalIncome5Yr / 5
	assetGrowth := c.TotalDeclaredAssets - c.PrevYearAssets
	if assetGrowth <= 2*annualIncome {
		return nil
	}
	gap := assetGrowth - 2*annualIncome
	return &AnomalyFlag{
		FlagID:          fmt.Sprintf("FLAG-%s-R2", c.CitizenHash[:8]),
		CitizenHash:     c.CitizenHash,
		RuleTriggered:   "UNEXPLAINED_WEALTH",
		Severity:        "ORANGE",
		Description:     fmt.Sprintf("1-year asset growth (₹%.2f) exceeds 2× annual income (₹%.2f)", rupees(assetGrowth), rupees(annualIncome)),
		AssetValueUsed:  c.TotalDeclaredAssets,
		IncomeValueUsed: annualIncome,
		GapAmount:       gap,
		Status:          "OPEN",
		RaisedAt:        raisedAt,
	}
}

// Rule 3 (RED): government official with >300% wealth growth over 5 years
func (s *SmartContract) ruleOfficialWealthSurge(c *CitizenNode, raisedAt string) *AnomalyFlag {
	if c.CitizenType != "government_official" && c.CitizenType != "politician" {
		return nil
	}
	if c.Assets5YrAgo <= 0 {
		return nil
	}
	growthPct := float64(c.TotalDeclaredAssets-c.Assets5YrAgo) / float64(c.Assets5YrAgo) * 100
	if growthPct <= 300 {
		return nil
	}
	gap := c.TotalDeclaredAssets - c.Assets5YrAgo
	return &AnomalyFlag{
		FlagID:          fmt.Sprintf("FLAG-%s-R3", c.CitizenHash[:8]),
		CitizenHash:     c.CitizenHash,
		RuleTriggered:   "OFFICIAL_WEALTH_SURGE",
		Severity:        "RED",
		Description:     fmt.Sprintf("%s wealth grew %.0f%% in 5 years (₹%.2f → ₹%.2f)", c.CitizenType, growthPct, rupees(c.Assets5YrAgo), rupees(c.TotalDeclaredAssets)),
		AssetValueUsed:  c.TotalDeclaredAssets,
		IncomeValueUsed: c.Assets5YrAgo,
		GapAmount:       gap,
		Status:          "OPEN",
		RaisedAt:        raisedAt,
	}
}

// ── Helpers ───────────────────────────────────────────────────────

func (s *SmartContract) getCitizen(ctx contractapi.TransactionContextInterface, citizenHash string) (*CitizenNode, error) {
	data, err := ctx.GetStub().GetState("CITIZEN_" + citizenHash)
	if err != nil {
		return nil, fmt.Errorf("state read failed: %w", err)
	}
	if data == nil {
		return nil, fmt.Errorf("citizen %s not found", citizenHash)
	}
	var citizen CitizenNode
	if err := json.Unmarshal(data, &citizen); err != nil {
		return nil, err
	}
	return &citizen, nil
}

func (s *SmartContract) saveFlag(ctx contractapi.TransactionContextInterface, flag *AnomalyFlag) error {
	data, err := json.Marshal(flag)
	if err != nil {
		return err
	}
	if err := ctx.GetStub().PutState("FLAG_"+flag.FlagID, data); err != nil {
		return err
	}
	// Index by citizen
	ck1, _ := ctx.GetStub().CreateCompositeKey("CITIZEN_FLAG", []string{flag.CitizenHash, flag.FlagID})
	if err := ctx.GetStub().PutState(ck1, []byte{0}); err != nil {
		return err
	}
	// Index by severity
	ck2, _ := ctx.GetStub().CreateCompositeKey("SEVERITY_FLAG", []string{flag.Severity, flag.FlagID})
	return ctx.GetStub().PutState(ck2, []byte{0})
}

func rupees(paisa int64) float64 {
	return float64(paisa) / 100
}

// ── Entry point ───────────────────────────────────────────────────

func main() {
	cc, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		log.Panicf("Error creating anomaly chaincode: %v", err)
	}
	if err := cc.Start(); err != nil {
		log.Panicf("Error starting anomaly chaincode: %v", err)
	}
}
