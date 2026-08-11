#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
runtime_dir="$(mktemp -d)"
log_file="${runtime_dir}/selfhost.log"
port="${ABCM_SMOKE_PORT:-8791}"
server_pid=""

cleanup() {
  if [[ -n "${server_pid}" ]]; then
    kill "${server_pid}" 2>/dev/null || true
    wait "${server_pid}" 2>/dev/null || true
  fi
  rm -rf "${runtime_dir}"
}
trap cleanup EXIT

cd "${project_root}"
ABCM_DATA_DIR="${runtime_dir}/data" ABCM_INTERNAL_PORT="${port}" ABCM_BIND_IP="127.0.0.1" \
  bash scripts/run-selfhost.sh >"${log_file}" 2>&1 &
server_pid=$!

for _ in $(seq 1 45); do
  if curl -fsS "http://127.0.0.1:${port}/api/health" >"${runtime_dir}/health.json"; then
    break
  fi
  if ! kill -0 "${server_pid}" 2>/dev/null; then
    cat "${log_file}" >&2
    exit 1
  fi
  sleep 1
done

curl -fsS "http://127.0.0.1:${port}/" >"${runtime_dir}/home.html"
curl -fsS "http://127.0.0.1:${port}/api/data-manifest" >"${runtime_dir}/manifest.json"

node -e '
  const fs = require("node:fs");
  const health = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  const manifest = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  const home = fs.readFileSync(process.argv[3], "utf8");
  if (health.release !== 37 || manifest.build?.siteRelease !== 37) process.exit(1);
  if (!home.includes("Austrian Business Cycle Monitor")) process.exit(1);
' "${runtime_dir}/health.json" "${runtime_dir}/manifest.json" "${runtime_dir}/home.html"

echo "Self-host smoke passed on production Worker artifact."
