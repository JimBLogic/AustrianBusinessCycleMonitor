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
  if node scripts/check-runtime-health.mjs "http://127.0.0.1:${port}/api/health" >"${runtime_dir}/readiness.json" 2>/dev/null; then
    curl -sS --max-time 5 "http://127.0.0.1:${port}/api/health" >"${runtime_dir}/health.json"
    break
  fi
  if ! kill -0 "${server_pid}" 2>/dev/null; then
    set +e
    wait "${server_pid}"
    server_status=$?
    set -e
    server_pid=""
    echo "Self-host runtime exited before becoming healthy (status ${server_status})." >&2
    cat "${log_file}" >&2
    exit 1
  fi
  sleep 1
done

if [[ ! -s "${runtime_dir}/health.json" ]]; then
  echo "Self-host runtime did not become healthy before the timeout." >&2
  cat "${log_file}" >&2
  exit 1
fi

curl -fsS "http://127.0.0.1:${port}/" >"${runtime_dir}/home.html"
curl -fsS "http://127.0.0.1:${port}/api/data-manifest" >"${runtime_dir}/manifest.json"

node -e '
  const fs = require("node:fs");
  const health = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  const manifest = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  const home = fs.readFileSync(process.argv[3], "utf8");
  const expected = Number(fs.readFileSync("app/version.ts", "utf8").match(/SITE_RELEASE = ([0-9]+);/)[1]);
  if (health.siteRelease !== expected || manifest.build?.siteRelease !== expected) process.exit(1);
  if (!home.includes("Austrian Business Cycle Monitor")) process.exit(1);
' "${runtime_dir}/health.json" "${runtime_dir}/manifest.json" "${runtime_dir}/home.html"

node --input-type=module - "${runtime_dir}/home.html" "http://127.0.0.1:${port}" <<'NODE'
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const html=await readFile(process.argv[2],'utf8'),origin=process.argv[3];
const assets=[...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+\.(?:js|css))"/g)].map(match=>match[1]))];
assert.ok(assets.some(path=>path.endsWith('.js')),'SSR page has no hydration scripts');
assert.ok(assets.some(path=>path.endsWith('.css')),'SSR page has no stylesheet');
for(const path of assets) {
  const response=await fetch(new URL(path,origin),{signal:AbortSignal.timeout(10000)});
  assert.equal(response.status,200,`${path} is not served`);
  assert.match(response.headers.get('content-type')??'',path.endsWith('.css')?/text\/css/:/(?:javascript|ecmascript)/,`${path} has incorrect MIME type`);
  assert.ok((await response.text()).length>0,`${path} is empty`);
}
console.log(`Verified ${assets.length} real JavaScript/CSS assets and MIME types.`);
NODE

echo "Self-host smoke passed on production Worker artifact, including browser assets."
