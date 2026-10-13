#!/usr/bin/env bash
set -euo pipefail
qa_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
app_root="${qa_root}/../sites-current"
runtime_dir="$(mktemp -d)"
server_pid=""
cleanup() {
  if [[ -n "${server_pid}" ]]; then kill "${server_pid}" 2>/dev/null || true; wait "${server_pid}" 2>/dev/null || true; fi
  rm -rf "${runtime_dir}"
}
trap cleanup EXIT INT TERM
node "${qa_root}/seed-real-snapshot.mjs" "${runtime_dir}/seed.sql"
cd "${app_root}"
node_modules/.bin/wrangler d1 migrations apply DB --local --config wrangler.selfhost.jsonc --persist-to "${runtime_dir}/data"
node_modules/.bin/wrangler d1 execute DB --local --config wrangler.selfhost.jsonc --persist-to "${runtime_dir}/data" --file "${runtime_dir}/seed.sql"
ABCM_DATA_DIR="${runtime_dir}/data" ABCM_INTERNAL_PORT=8793 ABCM_BIND_IP=127.0.0.1 bash scripts/run-selfhost.sh &
server_pid=$!
wait "${server_pid}"
