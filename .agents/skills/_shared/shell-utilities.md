# Shell utilities (soft dependencies)

Optional CLI tools on the **host machine**. Skills do **not** hard-gate on these — use fallbacks when missing.

Agents in **Cursor** should prefer **built-in tools** (`Grep`, `Glob`, `Read`) over shell search when possible. Shell utilities are for scripts, piping, and narrow terminal filters.

## Recommended (soft)

| Tool | Install (macOS) | Use when | Agent fallback if missing |
|------|-----------------|----------|-------------------------|
| **`rg`** (ripgrep) | `brew install ripgrep` | Fast filtered search in terminal; large stdout pipes | Workspace **`Grep`** tool, or `grep -E` |
| **`jq`** | `brew install jq` | Parse/filter JSON in shell one-liners | `python3 -c "import json,…"` |
| **`fd`** | `brew install fd` | Faster `find` in interactive shell | `find`, **`Glob`** tool |
| **`bat`** | `brew install bat` | Human-readable file preview in terminal | `cat`, **`Read`** tool |

## Agent rules

1. **Vault markdown search** — QMD first, then **`Grep`** / `Glob` / `Read`. Do not require `rg`. See [qmd-search.md](../../rules/qmd-search.md).
2. **Terminal one-liners** — use **`grep -E`** / **`grep -i`** when `rg` is not guaranteed (macOS clean installs often lack ripgrep).
3. **Scripts in `.scripts/`**: stick to **Python 3 stdlib** + documented hard deps (`gws`, `cursor`). Any script that calls `gws` must also offer a connector JSON mode (`--from-json`, `--events-json`, …) so connector-only harnesses get the same logic. Avoid `rg`/`jq` in preflight scripts unless guarded:

   ```bash
   if command -v rg >/dev/null; then rg 'pattern'; else grep -E 'pattern'; fi
   ```

4. **Token efficiency** — piping MCP/CLI JSON through `jq` or `rg` in the shell can shrink what enters context vs dumping raw JSON. Prefer:

   ```bash
   cursor agent mcp list-tools atlassian 2>&1 | grep -iE 'searchJira|getJira|getAccessible'
   ```

   over reading an unfiltered 40-tool list into the transcript.

## Hard vs soft (summary)

| Tier | Examples | Gate? |
|------|----------|-------|
| **Hard** | Google Workspace (`gws` **or** connectors), `obsidian`, Atlassian MCP (A9 for `/jira-done-mail`) | Yes. Ensure/login once for OAuth tools; for Workspace, abort only if **no** path works |
| **Soft** | `rg`, `jq`, `fd`, `bat` | No — fall back |
| **Built-in (Cursor)** | `Grep`, `Glob`, `Read`, QMD MCP | Always prefer for agents |

## Related

- [google-workspace-cli.md](google-workspace-cli.md): `gws` or connectors for Gmail, Calendar, Drive, and Docs
