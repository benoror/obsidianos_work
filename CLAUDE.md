# Claude Code — Project Instructions

Read [AGENTS.md](AGENTS.md) for the full skill reference, conventions, and vault layout.

## Skills

Project skills are symlinked for Claude Code discovery: [`.claude/skills`](.claude/skills) → [`.agents/skills/`](.agents/skills/). Edit files under `.agents/skills/` only.

## Rules

Read and follow these shared rules:

- [.agents/rules/qmd-search.md](.agents/rules/qmd-search.md) — prefer QMD over grep for vault search (always apply)

When working in `.agents/skills/`:

- [.agents/rules/skill-conventions.md](.agents/rules/skill-conventions.md) — skill structure, shared conventions, project context
- [.agents/rules/skill-registry.md](.agents/rules/skill-registry.md) — keep skill tables in sync when skills change

## MCP Setup

Claude Code does not read `.cursor/mcp.json`. Add the QMD MCP server manually:

```bash
claude mcp add qmd -- npx qmd mcp
```

**Google Workspace** (Docs, Drive, Calendar, Gmail) is accessed via the **`gws` CLI** in the terminal — not via MCP. Install and authenticate per [README.md](README.md) § Google Workspace CLI.
