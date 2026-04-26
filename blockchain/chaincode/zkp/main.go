package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ── Data types ────────────────────────────────────────────────────

// ZKPProof is the on-chain record of a verified proof submission.
// The API verifies the Groth16 math off-chain (snarkjs), then calls
// SubmitProof to record the result immutably on the ledger.
// We store the proof HASH, not the raw proof, to keep state lean.
type ZKPProof struct {
	ProofID       string   `json:"proofId"`
	CitizenHash   string   `json:"citizenHash"`
	QueryType     string   `json:"queryType"`     // e.g. ASSET_ABOVE_THRESHOLD
	ProofHash     string   `json:"proofHash"`     // SHA-256 of the raw proof JSON
	PublicSignals []string `json:"publicSignals"` // [threshold, commitment]
	Threshold     string   `json:"threshold"`     // paisa — human-readable index field
	IsVerified    bool     `json:"isVerified"`
	VerifiedAt    string   `json:"verifiedAt"`
	ExpiresAt     string   `json:"expiresAt"`
	SubmittedAt   string   `json:"submittedAt"`
	SubmittedBy   string   `json:"submittedBy"`
}

// VerifiedClaim is a lightweight, expiring record that a claim was proven.
type VerifiedClaim struct {
	ClaimID     string `json:"claimId"`
	CitizenHash string `json:"citizenHash"`
	ClaimType   string `json:"claimType"`
	IsValid     bool   `json:"isValid"`
	ValidUntil  string `json:"validUntil"`
	ProofID     string `json:"proofId"`
	IssuedAt    string `json:"issuedAt"`
}

// ── Contract ──────────────────────────────────────────────────────

type SmartContract struct {
	contractapi.Contract
}

func txTime(ctx contractapi.TransactionContextInterface) string {
	ts, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return time.Now().UTC().Format(time.RFC3339)
	}
	return ts.AsTime().UTC().Format(time.RFC3339)
}

// SubmitProof records the result of an API-verified Groth16 proof on-chain.
//
// Parameters:
//   citizenHash     — identity the proof is bound to
//   queryType       — e.g. "ASSET_ABOVE_THRESHOLD"
//   proofJSON       — raw Groth16 proof JSON (used only to compute proofHash)
//   publicSignalsJSON — JSON array of public signals: ["threshold","commitment"]
//   threshold       — the threshold value in paisa (for indexing)
//   submittedBy     — accessor hash of the officer/system requesting the proof
//   isVerifiedStr   — "true" if the API verified the proof, "false" otherwise
//
// The chaincode trusts the API's verification result. Anyone can independently
// re-verify using the public verification key + proofJSON + publicSignals.
func (s *SmartContract) SubmitProof(
	ctx contractapi.TransactionContextInterface,
	citizenHash, queryType, proofJSON, publicSignalsJSON, threshold, submittedBy, isVerifiedStr string,
) (*ZKPProof, error) {
	if proofJSON == "" || publicSignalsJSON == "" {
		return nil, fmt.Errorf("proofJSON and publicSignalsJSON are required")
	}

	// Reject if the API reported verification failure
	isVerified := isVerifiedStr == "true"
	if !isVerified {
		return nil, fmt.Errorf("proof verification failed — proof rejected")
	}

	// Parse public signals
	var publicSignals []string
	if err := json.Unmarshal([]byte(publicSignalsJSON), &publicSignals); err != nil {
		return nil, fmt.Errorf("invalid publicSignalsJSON: %w", err)
	}

	// Compute proof hash for anti-replay and independent verification
	sum := sha256.Sum256([]byte(proofJSON))
	proofHash := hex.EncodeToString(sum[:])

	// Anti-replay: reject if this exact proof was already submitted
	existing, _ := ctx.GetStub().GetState("ZKPHASH_" + proofHash)
	if existing != nil {
		return nil, fmt.Errorf("proof already submitted (replay detected)")
	}

	txID := ctx.GetStub().GetTxID()
	ts := txTime(ctx)

	// Expires in 90 days
	expiresAt := func() string {
		rawTs, err := ctx.GetStub().GetTxTimestamp()
		if err != nil {
			return time.Now().UTC().AddDate(0, 0, 90).Format(time.RFC3339)
		}
		return rawTs.AsTime().UTC().AddDate(0, 0, 90).Format(time.RFC3339)
	}()

	record := ZKPProof{
		ProofID:       fmt.Sprintf("ZKP-%s", txID[:16]),
		CitizenHash:   citizenHash,
		QueryType:     queryType,
		ProofHash:     proofHash,
		PublicSignals: publicSignals,
		Threshold:     threshold,
		IsVerified:    true,
		VerifiedAt:    ts,
		ExpiresAt:     expiresAt,
		SubmittedAt:   ts,
		SubmittedBy:   submittedBy,
	}

	data, err := json.Marshal(record)
	if err != nil {
		return nil, err
	}

	// Store the proof record
	if err := ctx.GetStub().PutState("ZKP_"+record.ProofID, data); err != nil {
		return nil, err
	}

	// Mark hash as used (anti-replay sentinel — value is the proofId)
	if err := ctx.GetStub().PutState("ZKPHASH_"+proofHash, []byte(record.ProofID)); err != nil {
		return nil, err
	}

	// Composite index: citizen → queryType → proofId
	ck, _ := ctx.GetStub().CreateCompositeKey("CITIZEN_ZKP", []string{citizenHash, queryType, record.ProofID})
	if err := ctx.GetStub().PutState(ck, []byte{0}); err != nil {
		return nil, err
	}

	// Issue a VerifiedClaim
	if err := s.issueVerifiedClaim(ctx, citizenHash, queryType, record.ProofID, expiresAt, ts); err != nil {
		return nil, err
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

// GetVerifiedClaims returns all active (non-expired) verified claims for a citizen.
func (s *SmartContract) GetVerifiedClaims(
	ctx contractapi.TransactionContextInterface,
	citizenHash string,
) ([]*VerifiedClaim, error) {
	iter, err := ctx.GetStub().GetStateByPartialCompositeKey("CITIZEN_CLAIM", []string{citizenHash})
	if err != nil {
		return nil, err
	}
	defer iter.Close()

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
		if claim.ValidUntil > currentTime {
			claims = append(claims, &claim)
		}
	}
	return claims, nil
}

// GetProofsByQueryType returns all proofs for a citizen of a given query type.
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
