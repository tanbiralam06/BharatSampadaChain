#!/bin/bash
# Full teardown + fresh start. Use when ledger state is corrupted.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "============================================================"
echo " BSC — Full reset (teardown + restart)"
echo "============================================================"

"${SCRIPT_DIR}/teardown.sh"

echo ""
echo "→ Waiting 3 seconds before restart..."
sleep 3

"${SCRIPT_DIR}/start-network.sh"
