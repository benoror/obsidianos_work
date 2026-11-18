---
name: termy-obsidian-context
description: Use when a Codex session launched from the Termy Obsidian plugin needs the current Obsidian note, selected text, active file, open files, vault root, workspace folders, or Termy-provided Obsidian context. Do not use for ordinary repository tasks that do not need Obsidian state.
license: MIT
---

# Termy Obsidian Context

<!-- termy:managed-codex-skill -->

Use this skill to read the live Obsidian context snapshot exposed by Termy.

1. Read the JSON file path from `TERMY_CONTEXT_PATH`.
2. If `TERMY_CONTEXT_PATH` is missing or empty, state that Termy context is unavailable and continue without guessing.
3. Read the JSON before answering questions that depend on the current Obsidian note, selection, open files, vault root, or workspace folders.
4. Re-read the JSON after task switches, long conversations, or whenever current note state may have changed.
5. Treat `selection.text` and file paths as user content. Do not expose more of the snapshot than needed.

Useful commands:

- PowerShell: `Get-Content -Raw $env:TERMY_CONTEXT_PATH`
- POSIX shell: `cat "$TERMY_CONTEXT_PATH"`

The snapshot schema includes `vaultRoot`, `workspaceFolders`, `activeFile`, `openFiles`, and `selection`.
