#!/bin/bash
# Smoke tests against the green (preview) service.
# Usage: bash smoke-test.sh http://localhost:18080

set -e
BASE_URL=${1:-http://localhost:18080}

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

# 1. Readiness health check
echo "1. Health / readiness"
STATUS=$(curl -sf "$BASE_URL/actuator/health/readiness" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])" 2>/dev/null \
  || echo "UNREACHABLE")
check "status=UP" "UP" "$STATUS"

# 2. Liveness health check
echo "2. Health / liveness"
STATUS=$(curl -sf "$BASE_URL/actuator/health/liveness" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])" 2>/dev/null \
  || echo "UNREACHABLE")
check "status=UP" "UP" "$STATUS"

# 3. /api/hello returns 200
echo "3. GET /api/hello"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/hello")
check "HTTP 200" "200" "$CODE"

# 4. /api/employees returns 200 and non-empty body
echo "4. GET /api/employees"
BODY=$(curl -sf "$BASE_URL/api/employees" 2>/dev/null || echo "")
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/employees")
check "HTTP 200" "200" "$CODE"
[ -n "$BODY" ] && echo "  ✅ Response body not empty" && ((pass++)) \
               || { echo "  ❌ Empty response body"; ((fail++)); }

# 5. /api/profile returns 200
echo "5. GET /api/profile"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/profile")
check "HTTP 200" "200" "$CODE"

echo "───────────────────────────────"
echo "Results: $pass passed, $fail failed"

if [ $fail -gt 0 ]; then
  echo "❌ Smoke tests FAILED"
  exit 1
fi
echo "✅ All smoke tests PASSED"
