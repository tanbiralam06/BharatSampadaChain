SHELL := /bin/bash

COMPOSE_FABRIC := blockchain/network/docker-compose-fabric.yml
COMPOSE_APP    := docker/docker-compose.yml
PROJECT        := bsc

.PHONY: help setup seed reset stop teardown test test-api test-chaincode lint check-docker

help:
	@echo "BSC Makefile"
	@echo ""
	@echo "  setup          First-time: start Fabric, create channel, update anchors, deploy chaincodes, start API"
	@echo "  seed           Reinitialise PostgreSQL seed data (drops + recreates postgres container)"
	@echo "  reset          Full teardown + setup + seed (destructive)"
	@echo "  stop           Stop all containers, preserve ledger volumes"
	@echo "  test           Run all tests (chaincode + API)"
	@echo "  test-api       Run API Jest tests with coverage"
	@echo "  test-chaincode Run Go unit tests for all 4 chaincodes"
	@echo "  lint           Lint and type-check the API"
	@echo ""
	@echo "NOTE: Run from repo root inside WSL2 or Linux. Requires Docker Compose v2."

check-docker:
	@docker info > /dev/null 2>&1 || (echo "ERROR: Docker is not running or not accessible" && exit 1)

# ── First-time setup ──────────────────────────────────────────────────────────
setup: check-docker
	@echo "=== BSC: Starting Fabric network ==="
	docker compose -f $(COMPOSE_FABRIC) --project-name $(PROJECT) up -d
	@echo "=== Waiting 10s for peers to initialise ==="
	sleep 10
	@echo "=== Creating bsc-channel ==="
	bash blockchain/scripts/create-channel.sh
	@echo "=== Deploying all 4 chaincodes ==="
	bash blockchain/scripts/deploy-chaincode.sh
	@echo "=== Starting PostgreSQL, Redis, and API ==="
	docker compose -f $(COMPOSE_APP) --project-name $(PROJECT) up -d postgres redis api
	@echo ""
	@echo "=== Setup complete. Run: make seed ==="

# ── Database seed ─────────────────────────────────────────────────────────────
seed: check-docker
	@echo "=== Reseeding PostgreSQL ==="
	docker stop bsc-postgres 2>/dev/null || true
	docker rm bsc-postgres 2>/dev/null || true
	docker volume rm bsc_postgres-data 2>/dev/null || true
	docker compose -f $(COMPOSE_APP) --project-name $(PROJECT) up -d postgres
	@echo "=== Waiting 15s for PostgreSQL to initialise ==="
	sleep 15
	docker compose -f $(COMPOSE_APP) --project-name $(PROJECT) up -d redis api
	@echo "=== Seed complete ==="

# ── Full reset ────────────────────────────────────────────────────────────────
reset: check-docker
	@echo "=== BSC: Full reset — this will wipe ALL data ==="
	docker compose -f $(COMPOSE_APP) --project-name $(PROJECT) down --volumes --remove-orphans 2>/dev/null || true
	bash blockchain/scripts/teardown.sh 2>/dev/null || true
	sleep 3
	$(MAKE) setup
	$(MAKE) seed

# ── Stop (preserves ledger) ───────────────────────────────────────────────────
stop: check-docker
	docker compose -f $(COMPOSE_APP) --project-name $(PROJECT) stop 2>/dev/null || true
	docker compose -f $(COMPOSE_FABRIC) --project-name $(PROJECT) stop 2>/dev/null || true
	@echo "=== All containers stopped. Volumes preserved. ==="

# ── Tests ─────────────────────────────────────────────────────────────────────
test: test-chaincode test-api

test-chaincode:
	@echo "=== Go chaincode tests ==="
	cd blockchain/chaincode/anomaly  && go mod tidy && go test ./... -v -count=1
	cd blockchain/chaincode/property && go mod tidy && go test ./... -v -count=1
	cd blockchain/chaincode/access   && go mod tidy && go test ./... -v -count=1
	cd blockchain/chaincode/zkp      && go mod tidy && go test ./... -v -count=1

test-api:
	@echo "=== API Jest tests ==="
	cd api && npm test -- --coverage

# ── Lint ──────────────────────────────────────────────────────────────────────
lint:
	cd api && npm run lint && npm run typecheck
