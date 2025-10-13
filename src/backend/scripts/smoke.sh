#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-4000}"

echo "[SMOKE] esperando puerto $PORT"
for i in {1..30}; do
  nc -z localhost "$PORT" && break
  sleep 1
done

echo "[SMOKE] GET /api/health"
curl -fsS "http://localhost:${PORT}/api/health" | jq .
echo "[SMOKE] OK"

