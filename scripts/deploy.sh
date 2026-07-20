#!/usr/bin/env bash
# Wrapper for Node deploy pipeline (tests → push → prod smoke)
set -euo pipefail
cd "$(dirname "$0")/.."
echo "Village Ride deploy pipeline"
node scripts/deploy.mjs
