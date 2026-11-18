#!/usr/bin/env bash
# Atlassian MCP preflight for /jira-done-mail (external-auth A9).
set -euo pipefail

if ! command -v cursor >/dev/null 2>&1; then
  echo "check-atlassian-mcp: cursor CLI not found on PATH." >&2
  echo "Install Cursor CLI or run /jira-done-mail from Cursor IDE Composer (with Atlassian MCP enabled)." >&2
  exit 1
fi

list_out="$(cursor agent mcp list 2>&1)" || {
  echo "check-atlassian-mcp: cursor agent mcp list failed:" >&2
  echo "$list_out" >&2
  exit 1
}

if echo "$list_out" | grep -Eq '^atlassian: ready$'; then
  exit 0
fi

if echo "$list_out" | grep -Eq '^atlassian: requires_authentication$'; then
  echo "check-atlassian-mcp: Atlassian MCP is configured but not authenticated for Cursor CLI/agent." >&2
  echo "" >&2
  echo "Prefer (opens OAuth): .scripts/ensure-atlassian-mcp.sh" >&2
  echo "OAuth in Cursor IDE (Settings → MCP) does not always apply to CLI/agent sessions." >&2
  echo "In Cursor IDE Composer, call mcp_auth if the server shows needsAuth." >&2
  exit 1
fi

echo "check-atlassian-mcp: unexpected atlassian MCP status:" >&2
echo "$list_out" >&2
exit 1
