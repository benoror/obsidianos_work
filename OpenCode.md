# OpenCode / Crush — Project Instructions

Read [AGENTS.md](AGENTS.md) for the full skill reference, conventions, and vault layout.

## Skills

[`.opencode/skills`](.opencode/skills) symlinks to [`.agents/skills/`](.agents/skills/) (same tree as Cursor / Claude). OpenCode may also load `.agents/skills/` directly depending on version — keep canonical content in `.agents/skills/`.

## Rules

Read and follow these shared rules:

- [.agents/rules/qmd-search.md](.agents/rules/qmd-search.md) — prefer QMD over grep for vault search (always apply)
- [.agents/rules/skill-conventions.md](.agents/rules/skill-conventions.md) — skill structure, shared conventions, project context
- [.agents/rules/skill-registry.md](.agents/rules/skill-registry.md) — keep skill tables in sync when skills change

## MCP Setup

OpenCode does not read `.cursor/mcp.json`. Add the QMD MCP server to your `.opencode.json`:

```json
{
  "mcpServers": {
    "qmd": {
      "type": "stdio",
      "command": "npx",
      "args": ["qmd", "mcp"]
    }
  }
}
```

**Google Workspace** (Docs, Drive, Calendar, Gmail) is accessed via the **`gws` CLI** in the terminal — not via MCP. See [README.md](README.md) § Google Workspace CLI.
