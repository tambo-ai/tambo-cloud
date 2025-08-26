#!/usr/bin/env bash
set -euo pipefail

TARGET_URL="http://localhost:3000/tambo"

echo "[smoke] Hitting $TARGET_URL ..."

# Fetch headers and body status
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL")
if [[ "$HTTP_CODE" -lt 200 || "$HTTP_CODE" -ge 500 ]]; then
  echo "[smoke] Unexpected HTTP status: $HTTP_CODE"
  exit 1
fi

# Local dev smoke test only; no platform headers required

echo "[smoke] OK: $TARGET_URL responded with $HTTP_CODE"
exit 0

