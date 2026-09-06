#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
data_dir="${ABCM_DATA_DIR:-${project_root}/.selfhost-data}"
port="${ABCM_INTERNAL_PORT:-8787}"
bind_ip="${ABCM_BIND_IP:-0.0.0.0}"

mkdir -p "${data_dir}"
export WRANGLER_SEND_METRICS=false
export WRANGLER_WRITE_LOGS=false

args=(
  wrangler dev
  --config wrangler.selfhost.jsonc
  --local
  --ip "${bind_ip}"
  --port "${port}"
  --persist-to "${data_dir}"
  --show-interactive-dev-session=false
  --log-level warn
)

if [[ -n "${FRED_API_KEY:-}" ]]; then
  args+=(--var "FRED_API_KEY:${FRED_API_KEY}")
fi

cd "${project_root}"
# Arguments may contain the FRED API key; do not print them.
exec "${project_root}/node_modules/.bin/${args[0]}" "${args[@]:1}"
