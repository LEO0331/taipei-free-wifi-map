#!/usr/bin/env bash
set -euo pipefail

echo "=== Harness Initialization ==="

echo "=== npm ci ==="
npm ci

echo "=== npm run data:convert ==="
npm run data:convert

echo "=== Offline geographic tooling, audit and build ==="
npm run data:setup:geographic
npm run data:audit:geographic
npm run data:verify:geographic

echo "=== npm test (including rebuilt artifact hashes) ==="
npm test

echo "=== npm run build ==="
npm run build

echo "=== Verification Complete ==="
echo ""
echo "Next steps:"
echo "1. Read feature_list.json to see current feature state"
echo "2. Pick ONE unfinished feature to work on"
echo "3. Implement only that feature"
echo "4. Re-run verification before claiming done"
