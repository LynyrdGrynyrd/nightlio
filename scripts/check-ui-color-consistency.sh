#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TARGETS=(src/components src/views src/constants)
EXCLUDE_TESTS=(-g '!**/*.test.*')

run_check() {
  local name="$1"
  local pattern="$2"
  shift 2
  local extra=("$@")

  local out
  out="$(rg -n -e "$pattern" "${TARGETS[@]}" "${EXCLUDE_TESTS[@]}" "${extra[@]}" || true)"
  local count
  count="$(printf "%s" "$out" | awk 'NF {c++} END {print c+0}')"

  echo "${name}=${count}"
  if [[ "$count" -gt 0 ]]; then
    echo "$out"
    return 1
  fi
  return 0
}

echo "UI Color Consistency Check"
echo "policy=strict-token-only"

status=0

run_check \
  "dark_variant_usage" \
  "dark:" || status=1

run_check \
  "invalid_hsl_var_usage" \
  "hsl\\(var\\(--" || status=1

run_check \
  "hardcoded_tailwind_hues" \
  "text-(red|blue|green|yellow|orange|purple|pink|indigo|emerald|cyan|teal|lime|amber)-|bg-(red|blue|green|yellow|orange|purple|pink|indigo|emerald|cyan|teal|lime|amber)-|border-(red|blue|green|yellow|orange|purple|pink|indigo|emerald|cyan|teal|lime|amber)-|ring-(red|blue|green|yellow|orange|purple|pink|indigo|emerald|cyan|teal|lime|amber)-" || status=1

run_check \
  "hex_literal_colors" \
  "#[0-9A-Fa-f]{3,8}(?![0-9A-Za-z_])" \
  -P \
  -g '!src/components/auth/GoogleIcon.tsx' || status=1

run_check \
  "literal_white_usage" \
  "\\b(text|bg|border)-white(?:/[0-9.]+)?\\b|color=\\\"white\\\"|color:\\s*'white'|color:\\s*\\\"white\\\"" \
  -P || status=1

if [[ "$status" -ne 0 ]]; then
  echo "Result: FAIL"
  exit 1
fi

echo "Result: PASS"
