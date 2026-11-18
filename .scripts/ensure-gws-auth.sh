#!/usr/bin/env bash
# Ensure gws is installed and OAuth-authenticated.
# On auth failure, opens the browser via `gws auth login`, then re-checks.
# Exit 0 = OK. Exit non-zero = missing binary or still unauthenticated after login.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if .scripts/check-gws-auth.sh; then
  exit 0
fi

if ! command -v gws >/dev/null 2>&1; then
  echo "ensure-gws-auth: gws not on PATH — cannot open OAuth. Install: brew install googleworkspace-cli" >&2
  exit 1
fi

status_json="$(gws auth status 2>/dev/null || true)"

if echo "$status_json" | grep -q '"encryption_valid": false'; then
  echo "ensure-gws-auth: credential decryption failed (encryption_valid: false)." >&2
  echo "Setting GOOGLE_WORKSPACE_CLI_KEYRING_BACKEND=file for this login…" >&2
  export GOOGLE_WORKSPACE_CLI_KEYRING_BACKEND=file
  gws auth logout >/dev/null 2>&1 || true
fi

echo "ensure-gws-auth: opening Google OAuth in your browser (gws auth login)…" >&2
echo "Complete sign-in in the browser, then return here." >&2

if ! gws auth login; then
  echo "ensure-gws-auth: gws auth login failed or was cancelled." >&2
  exit 1
fi

if .scripts/check-gws-auth.sh; then
  echo "ensure-gws-auth: gws auth OK." >&2
  exit 0
fi

echo "ensure-gws-auth: still unauthenticated after login. Run: gws auth status" >&2
exit 1
