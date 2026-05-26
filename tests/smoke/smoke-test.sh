#!/bin/bash
# Smoke tests for the department service green preview.
# Usage: bash smoke-test.sh http://localhost:18081

set -e
BASE_URL=${1:-http://localhost:18081}

pass=0
fail=0

check() {
  local name=$1 expected=$2 actual=$3
  if [ "$actual" = "$expected" ]; then
    echo "  ✅ $name"
    ((pass++))
  else
    echo "  ❌ $name — expected '$expected' got '$actual'"
    ((fail++))
  fi
}

echo ""
echo "🔍 Smoke tests → $BASE_URL"
echo "───────────────────────────────"

echo "1. Health / readiness"
STATUS=$(curl -sf "$BASE_URL/actuator/health/readiness" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])" 2>/dev/null \
  || echo "UNREACHABLE")
check "status=UP" "UP" "$STATUS"

echo "2. Health / liveness"
STATUS=$(curl -sf "$BASE_URL/actuator/health/liveness" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])" 2>/dev/null \
  || echo "UNREACHABLE")
check "status=UP" "UP" "$STATUS"

echo "3. GET /api/list"
BODY=$(curl -sf "$BASE_URL/api/list" 2>/dev/null || echo "")
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/list")
check "HTTP 200" "200" "$CODE"
[ -n "$BODY" ] && echo "  ✅ Response body not empty" && ((pass++)) \
               || { echo "  ❌ Empty response body"; ((fail++)); }

echo "4. GET /api/envmsg"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/envmsg")
check "HTTP 200" "200" "$CODE"

echo "───────────────────────────────"
echo "Results: $pass passed, $fail failed"

if [ $fail -gt 0 ]; then
  echo "❌ Smoke tests FAILED"
  exit 1
fi
echo "✅ All smoke tests PASSED"
