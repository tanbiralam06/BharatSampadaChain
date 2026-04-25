package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ── Data types ────────────────────────────────────────────────────

// ZKPProof stores a submitted proof and its verification result.
// Phase 1: stores proof metadata and simulates verification.
// Phase 3: will integrate actual Groth16 verification via circom/snarkjs.
type ZKPProof struct {
	ProofID      string `json:"proofId"`
	CitizenHash  string `json:"citizenHash"`
	QueryType    string `json:"queryType"` // INCOME_ABOVE_THRESHOLD | ASSET_RANGE | RESIDENCE | TAX_COMPLIANCE
	Proof        string `json:"proof"`        // Groth16 proof JSON (base64 in Phase 3)
	PublicInputs string `json:"publicInputs"` // public signals as JSON
	IsVerified   bool   `json:"isVerified"`
	VerifiedAt   string `json:"verifiedAt"`
	ExpiresAt    string `json:"expiresAt"`
	SubmittedAt  string `json:"submittedAt"`
	SubmittedBy  string `json:"submittedBy"` // accessor requesting the proof
}

// VerifiedClaim is a lightweight record proving a claim was verified without exposing the data.
type VerifiedClaim struct {
	ClaimID     string `json:"claimId"`
	CitizenHash string `json:"citizenHash"`
	ClaimType   string `json:"claimType"` // e.g., "INCOME_ABOVE_5L", "TAX_COMPLIANT_3YR"
	IsValid     bool   `json:"isValid"`
	ValidUntil  string `json:"validUntil"`
	ProofID     string `json:"proofId"`
	IssuedAt    string `json:"issuedAt"`
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

// SubmitProof accepts a ZKP proof submission and performs verification.
// Phase 1: simulates verification (always returns true for valid-format proofs).
// Phase 3: will call actual Groth16 verifier with the verification key.
func (s *SmartContract) SubmitProof(
	ctx contractapi.TransactionContextInterface,
	citizenHash, queryType, proof, publicInputs, submittedBy string,
) (*ZKPProof, error) {
	if proof == "" || publicInputs == "" {
		return nil, fmt.Errorf("proof and publicInputs are required")
	}

	txID := ctx.GetStub().GetTxID()
	ts := txTime(ctx)

	// Phase 1: simulate verification by checking proof is non-empty and valid JSON structure
	isVerified := s.simulateVerification(proof, publicInputs)

	// Proof expires 30 days from the transaction timestamp
	expiresAt := func() string {
		rawTs, err := ctx.GetStub().GetTxTimestamp()
		if err != nil {
			return time.Now().UTC().AddDate(0, 0, 30).Format(time.RFC3339)
		}
		return rawTs.AsTime().UTC().AddDate(0, 0, 30).Format(time.RFC3339)
	}()

	record := ZKPProof{
		ProofID:      fmt.Sprintf("ZKP-%s", txID[:16]),
		CitizenHash:  citizenHash,
		QueryType:    queryType,
		Proof:        proof,
		PublicInputs: publicInputs,
		IsVerified:   isVerified,
		ExpiresAt:    expiresAt,
		SubmittedAt:  ts,
		SubmittedBy:  submittedBy,
	}
	if isVerified {
		record.VerifiedAt = ts
	}

	data, err := json.Marshal(record)
	if err != nil {
		return nil, err
	}
	if err := ctx.GetStub().PutState("ZKP_"+record.ProofID, data); err != nil {
		return nil, err
	}

	// Index by citizen + queryType for retrieval
	ck, _ := ctx.GetStub().CreateCompositeKey("CITIZEN_ZKP", []string{citizenHash, queryType, record.ProofID})
	if err := ctx.GetStub().PutState(ck, []byte{0}); err != nil {
		return nil, err
	}

	// If verified, also issue a VerifiedClaim
	if isVerified {
		if err := s.issueVerifiedClaim(ctx, citizenHash, queryType, record.ProofID, expiresAt, ts); err != nil {
			return nil, err
		}
	}

	return &record, nil
}

// GetProof retrieves a proof record by ID.
func (s *SmartContract) GetProof(
	ctx contractapi.TransactionContextInterface,
	proofID string,
) (*ZKPProof, error) {
	data, err := ctx.GetStub().GetState("ZKP_" + proofID)
	if err != nil {
		return nil, fmt.Errorf("state read failed: %w", err)
	}
	if data == nil {
		return nil, fmt.Errorf("proof %s not found", proofID)
	}
	var proof ZKPProof
	if err := json.Unmarshal(data, &proof); err != nil {
		return nil, err
	}
	return &proof, nil
}

// GetVerifiedClaims returns all active verified claims for a citizen.
func (s *SmartContract) GetVerifiedClaims(
	ctx contractapi.TransactionContextInterface,
	citizenHash string,
) ([]*VerifiedClaim, error) {
	iter, err := ctx.GetStub().GetStateByPartialCompositeKey("CITIZEN_CLAIM", []string{citizenHash})
	if err != nil {
		return nil, err
	}
	defer iter.Close()

	// Use wall-clock time for expiry comparison — this is a read (evaluateTransaction),
	// so non-determinism here does not affect endorsement consistency.
	currentTime := time.Now().UTC().Format(time.RFC3339)

	var claims []*VerifiedClaim
	for iter.HasNext() {
		kv, err := iter.Next()
		if err != nil {
			return nil, err
		}
		_, parts, err := ctx.GetStub().SplitCompositeKey(kv.Key)
		if err != nil || len(parts) < 2 {
			continue
		}
		claimData, err := ctx.GetStub().GetState("CLAIM_" + parts[1])
		if err != nil || claimData == nil {
			continue
		}
		var claim VerifiedClaim
		if err := json.Unmarshal(claimData, &claim); err != nil {
			continue
		}
		// Only return non-expired claims
		if claim.ValidUntil > currentTime {
			claims = append(claims, &claim)
		}
	}
	return claims, nil
}

// GetProofsByQueryType returns all proofs for a citizen of a specific query type.
func (s *SmartContract) GetProofsByQueryType(
	ctx contractapi.TransactionContextInterface,
	citizenHash, queryType string,
) ([]*ZKPProof, error) {
	iter, err := ctx.GetStub().GetStateByPartialCompositeKey("CITIZEN_ZKP", []string{citizenHash, queryType})
	if err != nil {
		return nil, err
	}
	defer iter.Close()

	var proofs []*ZKPProof
	for iter.HasNext() {
		kv, err := iter.Next()
		if err != nil {
			return nil, err
		}
		_, parts, err := ctx.GetStub().SplitCompositeKey(kv.Key)
		if err != nil || len(parts) < 3 {
			continue
		}
		proofData, err := ctx.GetStub().GetState("ZKP_" + parts[2])
		if err != nil || proofData == nil {
			continue
		}
		var proof ZKPProof
		if err := json.Unmarshal(proofData, &proof); err != nil {
			continue
		}
		proofs = append(proofs, &proof)
	}
	return proofs, nil
}

// ── Helpers ───────────────────────────────────────────────────────

// simulateVerification: Phase 1 stub. Phase 3 replaces this with actual Groth16.
func (s *SmartContract) simulateVerification(proof, publicInputs string) bool {
	// Accept proofs that are valid JSON objects with at least one field
	var p map[string]interface{}
	if err := json.Unmarshal([]byte(proof), &p); err != nil {
		return false
	}
	var pi interface{}
	if err := json.Unmarshal([]byte(publicInputs), &pi); err != nil {
		return false
	}
	return len(p) > 0
}

func (s *SmartContract) issueVerifiedClaim(
	ctx contractapi.TransactionContextInterface,
	citizenHash, queryType, proofID, validUntil, issuedAt string,
) error {
	claimID := fmt.Sprintf("CLAIM-%s-%s", citizenHash[:8], queryType)
	claim := VerifiedClaim{
		ClaimID:     claimID,
		CitizenHash: citizenHash,
		ClaimType:   queryType,
		IsValid:     true,
		ValidUntil:  validUntil,
		ProofID:     proofID,
		IssuedAt:    issuedAt,
	}
	data, err := json.Marshal(claim)
	if err != nil {
		return err
	}
	if err := ctx.GetStub().PutState("CLAIM_"+claimID, data); err != nil {
		return err
	}
	ck, _ := ctx.GetStub().CreateCompositeKey("CITIZEN_CLAIM", []string{citizenHash, claimID})
	return ctx.GetStub().PutState(ck, []byte{0})
}

// ── Entry point ───────────────────────────────────────────────────

func main() {
	cc, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		log.Panicf("Error creating zkp chaincode: %v", err)
	}
	if err := cc.Start(); err != nil {
		log.Panicf("Error starting zkp chaincode: %v", err)
	}
}
