# Claude Code — Project Instructions

Read [AGENTS.md](AGENTS.md) for the full skill reference, conventions, and vault layout.

## Rules

Read and follow these shared rules:

- [.agents/rules/qmd-search.md](.agents/rules/qmd-search.md) — prefer QMD over grep for vault search (always apply)

When working in `.agents/skills/`:

- [.agents/rules/skill-conventions.md](.agents/rules/skill-conventions.md) — skill structure, shared conventions, project context
- [.agents/rules/skill-registry.md](.agents/rules/skill-registry.md) — keep skill tables in sync when skills change

## MCP Setup

Claude Code does not read `.cursor/mcp.json`. Add the MCP servers manually:

```bash
# QMD vault search
claude mcp add qmd -- npx qmd mcp

# Google Workspace (requires .env with OAuth credentials)
claude mcp add google-workspace -- sh -c 'set -a && . "$PWD/.env" && set +a && exec uvx --from "git+https://github.com/taylorwilsdon/google_workspace_mcp.git" workspace-mcp --tools docs drive calendar'

# Gmail (read-only)
claude mcp add google-gmail-readonly -- sh -c 'set -a && . "$PWD/.env" && set +a && exec uvx --from "git+https://github.com/taylorwilsdon/google_workspace_mcp.git" workspace-mcp --tools gmail --read-only'
```
