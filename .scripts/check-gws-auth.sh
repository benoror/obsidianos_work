#!/usr/bin/env bash
# Preflight: gws installed and OAuth session valid. Exit 0 = OK.
set -euo pipefail

if ! command -v gws >/dev/null 2>&1; then
  echo "gws not found on PATH. Install: brew install googleworkspace-cli (or npm i -g @googleworkspace/cli)" >&2
  exit 1
fi

if ! gws auth status >/dev/null 2>&1; then
  echo "gws is not authenticated. Prefer: .scripts/ensure-gws-auth.sh (opens OAuth)" >&2
  exit 1
fi

if status_json="$(gws auth status 2>/dev/null)" && echo "$status_json" | grep -q '"token_valid": false'; then
  if echo "$status_json" | grep -q '"encryption_valid": false'; then
    echo "gws credential decryption failed (encryption_valid: false)." >&2
    echo "Prefer: .scripts/ensure-gws-auth.sh (sets file keyring + opens OAuth)" >&2
    echo "Or set GOOGLE_WORKSPACE_CLI_KEYRING_BACKEND=file, then: gws auth logout && gws auth login" >&2
  elif echo "$status_json" | grep -qE 'invalid_grant|expired or revoked'; then
    echo "gws refresh token expired or revoked. Prefer: .scripts/ensure-gws-auth.sh" >&2
    echo "If this repeats every ~7 days, publish your OAuth app to In production (not Testing)." >&2
  else
    echo "gws OAuth token refresh failed (token_valid: false). Prefer: .scripts/ensure-gws-auth.sh" >&2
  fi
  exit 1
fi

exit 0
