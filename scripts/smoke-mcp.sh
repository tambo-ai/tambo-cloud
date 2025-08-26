#!/usr/bin/env bash
set -euo pipefail

TARGET_URL="https://mcp.tambo.co"

echo "[smoke] Hitting $TARGET_URL ..."

# Fetch headers and body status
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL")
if [[ "$HTTP_CODE" -lt 200 || "$HTTP_CODE" -ge 500 ]]; then
  echo "[smoke] Unexpected HTTP status: $HTTP_CODE"
  exit 1
fi

# Verify it is served via Vercel (header heuristic)
HEADERS=$(curl -sI "$TARGET_URL")
echo "$HEADERS" | grep -iE "x-vercel-id|server: vercel" >/dev/null || {
  echo "[smoke] Warning: Could not confirm Vercel headers. Continuing."
}

echo "[smoke] OK: $TARGET_URL responded with $HTTP_CODE"
exit 0

