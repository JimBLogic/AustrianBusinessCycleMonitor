#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "${SITES_ENV_READY:-}" != "1" ]]; then
  exec "${script_dir}/sites-env.sh" -- "$0" "$@"
fi

command -v timeout >/dev/null || {
  echo "build-verified.sh requires GNU timeout." >&2
  exit 69
}

vinext="${SITES_PROJECT_ROOT}/node_modules/.bin/vinext"
if [[ ! -x "${vinext}" ]]; then
  echo "vinext is unavailable. Run npm run install:ci and wait for it to finish before building." >&2
  exit 69
fi

echo "Checking TypeScript..."
"${SITES_PROJECT_ROOT}/node_modules/.bin/tsc" --noEmit --incremental false

echo "Running bounded vinext build..."
# Vite's multiple environments share dist and may preserve removed public files.
# Preserve previous output outside dist; never ship removed QA/obsolete assets.
if [[ -e "${SITES_PROJECT_ROOT}/dist" ]]; then
  mkdir -p "${SITES_PROJECT_ROOT}/.sites-runtime"
  previous_output="$(mktemp -d "${SITES_PROJECT_ROOT}/.sites-runtime/previous-build.XXXXXX")"
  mv -- "${SITES_PROJECT_ROOT}/dist" "${previous_output}/dist"
fi
timeout \
  --signal=TERM \
  --kill-after="${SITES_BUILD_KILL_AFTER:-10s}" \
  "${SITES_BUILD_TIMEOUT:-3m}" \
  "${vinext}" build

"${script_dir}/validate-artifact.sh"
