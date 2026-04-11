#!/usr/bin/env zsh
set -euo pipefail

export PATH="$HOME/homebrew/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

API_PID=""
WEB_PID=""

cleanup() {
  if [[ -n "$WEB_PID" ]] && kill -0 "$WEB_PID" 2>/dev/null; then
    kill "$WEB_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "$API_PID" ]] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

wait_for_url() {
  local url="$1"
  local attempts=0

  until curl -fsS "$url" >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    if (( attempts > 60 )); then
      echo "Timed out waiting for $url" >&2
      return 1
    fi
    sleep 1
  done
}

echo "[phase2] typecheck"
npm run typecheck --workspaces --if-present >/tmp/registerm4-typecheck.log

echo "[phase2] build"
npm run build --workspaces --if-present >/tmp/registerm4-build.log

echo "[phase2] api automated tests"
npm run test --workspace @sra/api >/tmp/registerm4-api-tests.log

echo "[phase2] start api"
npm run dev:api >/tmp/registerm4-api-dev.log 2>&1 &
API_PID=$!
wait_for_url "http://localhost:4000/health"

echo "[phase2] api negative-path matrix"
pass=0
fail=0
check() {
  local name="$1"
  local expected="$2"
  local method="$3"
  local endpoint="$4"
  local body="$5"
  local code

  if [[ "$method" == "GET" ]]; then
    code=$(curl -sS -o /tmp/registerm4-phase2-response.json -w "%{http_code}" -X "$method" "http://localhost:4000$endpoint")
  else
    code=$(curl -sS -o /tmp/registerm4-phase2-response.json -w "%{http_code}" -X "$method" "http://localhost:4000$endpoint" -H 'content-type: application/json' -d "$body")
  fi

  if [[ "$code" == "$expected" ]]; then
    pass=$((pass + 1))
  else
    echo "Negative test failed: $name expected $expected got $code" >&2
    cat /tmp/registerm4-phase2-response.json >&2
    fail=$((fail + 1))
  fi
}

user_json=$(curl -sS -X POST http://localhost:4000/auth/register -H 'content-type: application/json' -d '{"email":"phase2-script@example.com","password":"password123"}')
user_id=$(echo "$user_json" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')

check "register invalid payload" 400 POST /auth/register '{"email":"bad","password":"123"}'
check "register duplicate email" 409 POST /auth/register '{"email":"phase2-script@example.com","password":"password123"}'
check "login wrong password" 401 POST /auth/login '{"email":"phase2-script@example.com","password":"wrongpass"}'
check "credential missing user" 404 POST /credentials '{"userId":"missing","siteUrl":"https://example.com/login","username":"u","password":"p"}'
check "verify missing credential" 404 POST /credentials/nope/verify "{\"userId\":\"$user_id\"}"
check "schedule invalid timezone" 400 POST /schedules "{\"userId\":\"$user_id\",\"credentialId\":\"missing\",\"dayOfWeek\":1,\"time\":\"09:00\",\"timezone\":\"Not/AZone\",\"enabled\":true}"
check "attempts unknown user" 404 GET /attempts/does-not-exist ''

if (( fail > 0 )); then
  echo "Negative matrix failures: $fail" >&2
  exit 1
fi

echo "Negative matrix passed: $pass"

echo "[phase2] start web"
npm run dev:web >/tmp/registerm4-web-dev.log 2>&1 &
WEB_PID=$!
wait_for_url "http://localhost:3000"

html=$(curl -sS http://localhost:3000)
if [[ "$html" != *"Scheduled Registration Assistant"* ]]; then
  echo "Web smoke failed: expected title text not found" >&2
  exit 1
fi

echo "Web smoke passed"
echo "Phase 2 checks completed successfully"
