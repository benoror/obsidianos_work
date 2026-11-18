#!/usr/bin/env bash
# Ensure Atlassian MCP is authenticated for Cursor CLI/agent (external-auth A9).
# On requires_authentication, opens OAuth via `cursor agent mcp login atlassian`, then re-checks.
# Exit 0 = OK. Exit non-zero = missing cursor CLI or still unauthenticated after login.
#
# Cursor IDE Composer: if the Atlassian MCP server shows needsAuth, call mcp_auth instead
# of this script (IDE OAuth is separate from CLI).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if .scripts/check-atlassian-mcp.sh; then
  exit 0
fi

if ! command -v cursor >/dev/null 2>&1; then
  echo "ensure-atlassian-mcp: cursor CLI not found — cannot open OAuth." >&2
  echo "In Cursor IDE Composer, use mcp_auth on the atlassian server, or install the Cursor CLI." >&2
  exit 1
fi

list_out="$(cursor agent mcp list 2>&1)" || true

if ! echo "$list_out" | grep -Eq '^atlassian: requires_authentication$'; then
  # Unexpected status (not configured, not ready) — do not spam login
  echo "ensure-atlassian-mcp: Atlassian MCP is not in requires_authentication state; cannot auto-login." >&2
  echo "$list_out" >&2
  exit 1
fi

echo "ensure-atlassian-mcp: opening Atlassian OAuth (cursor agent mcp login atlassian)…" >&2
echo "Complete sign-in in the browser, then return here." >&2

if ! cursor agent mcp login atlassian; then
  echo "ensure-atlassian-mcp: mcp login failed or was cancelled." >&2
  exit 1
fi

if .scripts/check-atlassian-mcp.sh; then
  echo "ensure-atlassian-mcp: Atlassian MCP ready." >&2
  exit 0
fi

echo "ensure-atlassian-mcp: still not ready after login. Run: cursor agent mcp list" >&2
exit 1
