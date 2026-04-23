# BSC — Implementation Status

> Pick up exactly where we left off. Read top to bottom.

---

## Where We Are

**Phase 1 — Blockchain Layer: ~80% done.**
The Hyperledger Fabric testnet is live and partially deployed. One chaincode is committed. Three are pending due to a compile bug (now fixed).

---

## What Is Done

### Hyperledger Fabric Testnet
- `crypto-config.yaml` — 3 peer orgs (ITDeptMSP, RegistrarMSP, MCAMSP) + orderer org
- `configtx.yaml` — solo orderer, bsc-channel, MAJORITY endorsement policy (2 of 3 orgs)
- `docker-compose-fabric.yml` — 3 peers (LevelDB, not CouchDB — saves ~12 GB RAM on 8 GB machine), orderer, CLI
- Network is UP: genesis block created, bsc-channel created, all 3 peers joined

### Smart Contracts (Go — `blockchain/chaincode/`)
All 4 chaincodes written and go.sum files generated (`go mod tidy` done in each dir):

| Chaincode | Purpose | Deploy Status |
|-----------|---------|---------------|
| `anomaly` | CitizenNode, AnomalyFlag, 3 auto-rules (YELLOW/ORANGE/RED) | **Committed v1.1** ✓ |
| `property` | PropertyRecord, TransferRecord, encumbrance, undervaluation check | **NOT YET** — see below |
| `access` | Permission matrix, immutable access logs, role-based data control | **NOT YET** |
| `zkp` | ZKP proof submission + verification (Phase 1: simulated) | **NOT YET** |

### Node.js API Gateway (`api/`)
- Full folder structure in place: `src/config/`, `src/models/`, `src/services/`, `src/middleware/`, `src/fabric/`, `src/cache/`
- `npm install` done (node_modules present)
- **NOT started / NOT connected to Fabric yet** — waiting for all 4 chaincodes to be committed first

### Database
- `database/migrations/001_initial_schema.sql` written (7 tables)
- PostgreSQL not started yet (needs `docker-compose -f docker/docker-compose.yml up`)

---

## The Bug We Just Fixed

**File:** `blockchain/chaincode/property/main.go`, line 160

```go
// BEFORE (compile error — *string = string)
prop.PrevOwnerHash = prop.OwnerHash

// AFTER (correct)
prevOwner := prop.OwnerHash
prop.PrevOwnerHash = &prevOwner
```

This caused `peer lifecycle chaincode install` to fail with:
> `failed to marshal response: string field contains invalid UTF-8`

The Go compiler ran inside the `fabric-ccenv` Docker container, hit the type error, and Fabric couldn't proto-marshal the error response. Fix is on disk in `property/main.go`. Also removed `omitempty` from `TransferRecord.Reason` (contractapi treats omitted fields as missing required fields).

---

## Exact Next Step — Run These Commands

Open WSL2 and run in order:

```bash
# 1. Strip any Windows CRLF from the fixed property file
find /mnt/c/Users/alamt/Downloads/BSC/blockchain/chaincode/property -type f | xargs sed -i 's/\r$//'

# 2. Copy chaincode to WSL2 native FS (avoids NTFS/encoding issues during Go build)
cp -r /mnt/c/Users/alamt/Downloads/BSC/blockchain/chaincode ~/bsc-chaincode

# 3. Push the CRLF-clean files into the running CLI container
docker cp ~/bsc-chaincode/property bsc-cli:/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/
docker cp ~/bsc-chaincode/access   bsc-cli:/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/
docker cp ~/bsc-chaincode/zkp      bsc-cli:/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/

# 4. Deploy property v1.1, access v1.0, zkp v1.0
cd /mnt/c/Users/alamt/Downloads/BSC
bash blockchain/scripts/deploy-remaining.sh

# 5. Run smoke tests (all 5 should pass)
bash blockchain/scripts/invoke-test.sh
```

**If the network is DOWN** (containers not running), bring it back up first:
```bash
cd /mnt/c/Users/alamt/Downloads/BSC/blockchain/network
docker-compose -f docker-compose-fabric.yml up -d
# Wait ~15 seconds, then re-run the docker cp and deploy-remaining.sh steps above
```

---

## After All 5 Tests Pass — What's Next

1. **Start the API**
   ```bash
   cd /mnt/c/Users/alamt/Downloads/BSC/api
   cp .env.example .env   # edit FABRIC_CHANNEL, JWT_SECRET, etc.
   npm run dev
   ```
   API should start on `http://localhost:3000`

2. **Start PostgreSQL**
   ```bash
   cd /mnt/c/Users/alamt/Downloads/BSC
   docker-compose -f docker/docker-compose.yml up -d postgres redis
   # Run migration
   docker exec -i bsc-postgres psql -U bsc_user -d bsc_db < database/migrations/001_initial_schema.sql
   ```

3. **Test API endpoints** with Postman or curl — POST `/api/auth/login`, GET `/api/citizen/:hash`, etc.

4. **Phase 2 work** (once Phase 1 is fully verified):
   - Replace simulated ZKP verification in `zkp/main.go` with real Groth16 (circom + snarkjs)
   - Add benami / shell-company anomaly rules (require cross-citizen analysis at API layer)
   - Wire up the React frontend (`bsc-prototype/`) to live API

---

## Key Technical Decisions (context for future sessions)

| Decision | Why |
|----------|-----|
| LevelDB instead of CouchDB | 8 GB RAM — CouchDB would add ~3 containers and ~4 GB overhead |
| Solo orderer | Phase 1 testnet only — Raft consensus for production |
| MAJORITY policy (2 of 3 orgs) | Prevents any single ministry from unilaterally writing data |
| Pointer types (`*string`) for optional fields | `fabric-contract-api-go` marks non-pointer fields as "required" in auto-generated JSON schema |
| `--waitForEvent` on all invokes | Without it, a query immediately after invoke returns "not found" (block not committed yet) |
| property v1.1 (not v1.0) | Broken v1.0 package may be stored on ITDept peer from failed install attempt; using 1.1 skips it |
