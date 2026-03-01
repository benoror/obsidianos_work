# OpenCode / Crush — Project Instructions

Read [AGENTS.md](AGENTS.md) for the full skill reference, conventions, and vault layout.

## Rules

Read and follow these shared rules:

- [.agents/rules/qmd-search.md](.agents/rules/qmd-search.md) — prefer QMD over grep for vault search (always apply)
- [.agents/rules/skill-conventions.md](.agents/rules/skill-conventions.md) — skill structure, shared conventions, project context
- [.agents/rules/skill-registry.md](.agents/rules/skill-registry.md) — keep skill tables in sync when skills change

## MCP Setup

OpenCode does not read `.cursor/mcp.json`. Add MCP servers to your `.opencode.json`:

```json
{
  "mcpServers": {
    "qmd": {
      "type": "stdio",
      "command": "npx",
      "args": ["qmd", "mcp"]
    },
    "google-workspace": {
      "type": "stdio",
      "command": "sh",
      "args": ["-c", "set -a && . \"$PWD/.env\" && set +a && exec uvx --from 'git+https://github.com/taylorwilsdon/google_workspace_mcp.git' workspace-mcp --tools docs drive calendar"]
    },
    "google-gmail-readonly": {
      "type": "stdio",
      "command": "sh",
      "args": ["-c", "set -a && . \"$PWD/.env\" && set +a && exec uvx --from 'git+https://github.com/taylorwilsdon/google_workspace_mcp.git' workspace-mcp --tools gmail --read-only"]
    }
  }
}
```
