#!/usr/bin/env bash
# Preflight: obsidian CLI available and Obsidian app responding. Exit 0 = OK.
set -euo pipefail

if ! command -v obsidian >/dev/null 2>&1; then
  echo "obsidian CLI not found on PATH. Open Obsidian → Settings → General → enable CLI." >&2
  exit 1
fi

if ! obsidian version >/dev/null 2>&1; then
  echo "Obsidian CLI not responding. Start Obsidian and ensure CLI is enabled." >&2
  exit 1
fi

exit 0
