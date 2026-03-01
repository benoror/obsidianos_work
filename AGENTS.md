# Agents

This is an Obsidian vault with AI agent skills. See [USER.md](USER.md) for the vault owner's identity. Agents working in this repo should be aware of the following structure and conventions.

## Skills

Custom skills live in `.agents/skills/`. Each has a `SKILL.md` with usage, workflow, and conventions.

| Skill                                                          | What it does                                               | Arguments                                                   |
| -------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------- |
| [meeting](.agents/skills/meeting/SKILL.md)                     | Create a meeting note                                      |                                                             |
| ├ `/meeting`                                                   | Pick from today's Google Calendar events                   |                                                             |
| ├ `/meeting {title}`                                           | Manual creation with today's date                          | `folder={subfolder}`                                        |
| ├ `/meeting wrap <path>`                                       | Wrap up: cache → participants → todos → commit             |                                                             |
| └ `/meeting wrap pending [dates]`                              | Find & wrap all pending meetings                           | `today`, `yesterday`, `last week`, `2026-01-01..2026-02-03` |
| [cache-notes](.agents/skills/cache-notes/SKILL.md)             | Fetch & embed AI transcripts as Obsidian callouts          |                                                             |
| ├ `/cache-notes <path>`                                        | Cache a specific meeting file (prompts for URLs if empty)  |                                                             |
| ├ `/cache-notes all`                                           | Batch-cache all uncached meetings                          |                                                             |
| └ `/cache-notes refresh <path>`                                | Re-fetch and overwrite existing cache                      |                                                             |
| [fill-participants](.agents/skills/fill-participants/SKILL.md) | Resolve and fill `Participants:` frontmatter               |                                                             |
| ├ `/fill-participants <path>`                                  | Fill for a specific meeting note                           |                                                             |
| └ `/fill-participants all`                                     | Scan and fill all meetings missing participants            |                                                             |
| [followup-todos](.agents/skills/followup-todos/SKILL.md)       | Extract action items as Obsidian Tasks checkboxes          |                                                             |
| ├ `/followup-todos <path>`                                     | Extract from a specific meeting note                       |                                                             |
| └ `/followup-todos`                                            | Pick from recent meetings                                  |                                                             |
| [recap](.agents/skills/recap/SKILL.md)                         | Produce a recap from emails, Slack, Jira, and vault notes  |                                                             |
| ├ `/recap`                                                     | Recap current week (Monday through today)                  |                                                             |
| └ `/recap [dates]`                                             | Recap a specific date range                                | `today`, `yesterday`, `last week`, `2026-01-01..2026-02-03` |
| [commit](.agents/skills/commit/SKILL.md)                       | Stage and commit with inferred or explicit message         |                                                             |
| ├ `/commit`                                                    | Infer message from diff (staged or unstaged)               |                                                             |
| ├ `/commit <description>`                                      | Craft message from user-provided intent                    |                                                             |
| └ *(sequence mode)*                                            | Deferred — sub-skills skip, caller commits once at the end |                                                             |

## Rules

Shared rules live in `.agents/rules/` and are the single source of truth. Agent-specific wrappers point to them.

| Rule | Purpose |
| --- | --- |
| [qmd-search](.agents/rules/qmd-search.md) | Prefer QMD over grep for vault search (always apply) |
| [skill-conventions](.agents/rules/skill-conventions.md) | Skill structure, shared conventions, project context |
| [skill-registry](.agents/rules/skill-registry.md) | Keep skill tables in sync when skills change |

### Agent wrappers

| Agent | Instruction files | How rules are loaded |
| --- | --- | --- |
| Cursor | `.cursor/rules/*.mdc` | Auto-injected by glob; each `.mdc` points to `.agents/rules/` |
| Claude Code | `CLAUDE.md`, `.agents/skills/CLAUDE.md` | Read on startup; point to `.agents/rules/` |
| OpenCode / Crush | `OpenCode.md` | Read on startup; points to `.agents/rules/` |

## Vault Layout

```
Meetings/              Meeting notes by subfolder (PAM/, TBs/, Eng/, etc.)
Templates/             Obsidian templates
Teams/People/          Person files: @Name.md
Teams/                 Team files: +TeamName.md
ToDo's.md              Aggregated Tasks plugin view
Tracker.md             Project tracker
```

## Conventions

- **User**: See [USER.md](USER.md) for identity, timezone, aliases, and agent behavior rules.
- **Frontmatter**: YAML between `---` fences. `modified:` is managed by Obsidian — never set manually.
- **Participants**: `[[@Name]]` wikilinks (people) or `[[+Team]]` (teams).
- **AI Transcripts**: Cached under `## 🤖 AI Notes` with provider subheadings and collapsible callouts (`[!gemini_notes]-`, `[!gemini_todos]-`, `[!gemini_transcript]-`).
- **Tasks priorities**: 🔺 highest, ⏫ high, 🔼 medium, 🔽 low.

## MCP Servers

Configured in [.cursor/mcp.json](.cursor/mcp.json). Provides Google Workspace tools (Docs, Drive, Calendar).

## Syncing from Upstream

If you forked or cloned this repo into a private vault, you can pull structural updates (skills, rules, shared conventions) without overwriting your personal data.

```bash
./scripts/sync-upstream.sh              # fetch + merge
./scripts/sync-upstream.sh --preview    # see what's new without merging
```

First-time setup:

```bash
git remote add upstream <url-to-this-repo>
./scripts/sync-upstream.sh              # auto-configures merge driver on first run
```

Protected paths (always keep local version during merge): `USER.md`, `Tracker.md`, `.env`, `.cursor/mcp.json`, `Meetings/`, `Teams/`, `Templates/`, `Recaps/`. Edit `.gitattributes` to add or remove paths.
