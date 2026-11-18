# Agents

This is an Obsidian vault with AI agent skills. See [USER.md](USER.md) for the vault owner's identity. Agents working in this repo should be aware of the following structure and conventions.

## Skills

Custom skills live in `.agents/skills/`. Each has a `SKILL.md` with usage, workflow, and conventions.

| Skill                                                          | What it does                                               | Arguments                                                   |
| -------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------- |
| [meeting](.agents/skills/meeting/SKILL.md)                     | Create a meeting note                                      |                                                             |
| ├ `/meeting`                                                   | Pick from today's Google Calendar events                   |                                                             |
| ├ `/meeting {title}`                                           | Manual creation with today's date                          | `folder={subfolder}`                                        |
| ├ `/meeting wrap <path>`                                       | Wrap up: mail-transcripts → cache → participants → todos → commit |                                                      |
| └ `/meeting wrap pending [dates]`                              | Find & wrap all pending meetings                           | `today`, `yesterday`, `last week`, `2026-01-01..2026-02-03` |
| [cache-notes](.agents/skills/cache-notes/SKILL.md)             | Fetch & embed AI transcripts as Obsidian callouts          |                                                             |
| ├ `/cache-notes <path>`                                        | Cache a specific meeting file (prompts for URLs if empty)  |                                                             |
| ├ `/cache-notes all`                                           | Batch-cache all uncached meetings                          |                                                             |
| └ `/cache-notes refresh <path>`                                | Re-fetch and overwrite existing cache                      |                                                             |
| [fill-participants](.agents/skills/fill-participants/SKILL.md) | Resolve and fill `Participants:` frontmatter               |                                                             |
| ├ `/fill-participants <path>`                                  | Fill for a specific meeting note                           |                                                             |
| └ `/fill-participants all`                                     | Scan and fill all meetings missing participants            |                                                             |
| [followup-todos](.agents/skills/followup-todos/SKILL.md)       | Extract action items as plain markdown bullets               |                                                             |
| ├ `/followup-todos <path>`                                     | Extract from a specific meeting note                       |                                                             |
| └ `/followup-todos`                                            | `/note-status pending --step=todos`                        |                                                             |
| [recap](.agents/skills/recap/SKILL.md)                         | Produce a recap from emails, Slack, Jira, and vault notes  |                                                             |
| ├ `/recap`                                                     | Recap current week (Monday through today)                  |                                                             |
| └ `/recap [dates]`                                             | Recap a specific date range                                | `today`, `yesterday`, `last week`, `2026-01-01..2026-02-03` |
| [sync-upstream-obsidianos](.agents/skills/sync-upstream-obsidianos/SKILL.md) | Pull structural updates from upstream ObsidianOS |                                                             |
| ├ `/sync-upstream-obsidianos`                                  | Preview and merge upstream updates                         |                                                             |
| └ `/sync-upstream-obsidianos preview`                          | Show what's new without merging                            |                                                             |
| [note-status](.agents/skills/note-status/SKILL.md)             | Verify meeting notes are fully processed                   |                                                             |
| ├ `/note-status <path>`                                        | Check a specific note                                      |                                                             |
| ├ `/note-status [dates]`                                       | Check notes in a date range                                | `today`, `yesterday`, `last week`, `2026-01-01..2026-02-03` |
| ├ `/note-status all`                                           | Check every meeting note                                   |                                                             |
| └ `/note-status pending [dates]`                               | Filter to pending, prompt selection                        | `--step=notes\|cache\|participants\|todos`                  |
| [commit](.agents/skills/commit/SKILL.md)                       | Stage and commit with flexible intent parsing              |                                                             |
| ├ `/commit`                                                    | Staged files, or infer related changes                     |                                                             |
| ├ `/commit <file or folder>`                                   | Scope commit to a specific path                            |                                                             |
| ├ `/commit <description>`                                      | Infer scope from free-text intent                          |                                                             |
| ├ `/commit amend [scope/description]`                          | Amend last commit (with optional scope or new message)     |                                                             |
| └ *(sequence mode)*                                            | Deferred — sub-skills skip, caller commits once at the end |                                                             |
| [defuddle](.agents/skills/defuddle/SKILL.md)                   | Extract clean markdown from web pages with Defuddle CLI (prefer over raw fetch for articles & docs) | |
| [json-canvas](.agents/skills/json-canvas/SKILL.md)             | Create and edit Obsidian JSON Canvas (`.canvas`) files     |                                                             |
| [obsidian-bases](.agents/skills/obsidian-bases/SKILL.md)       | Create and edit Obsidian Bases (`.base`) — views, filters, formulas |                                                     |
| [obsidian-cli](.agents/skills/obsidian-cli/SKILL.md)           | Drive a running Obsidian app via the `obsidian` CLI (read/write/search, dev helpers) | |
| [obsidian-markdown](.agents/skills/obsidian-markdown/SKILL.md) | Obsidian Flavored Markdown — wikilinks, embeds, callouts, properties | |
| [mail-transcripts](.agents/skills/mail-transcripts/SKILL.md)   | Drain Gmail AI-transcript notifications into meeting `Notes:` (gws) | |
| [organize-meetings](.agents/skills/organize-meetings/SKILL.md) | Triage `Meetings/_inbox/` into the right subfolder via qmd + memory | `<path>`, `--auto` |
| [people-stubs](.agents/skills/people-stubs/SKILL.md)           | Batch-create `Teams/People/@Name.md` stubs from unresolved `[[@*]]` links | `--auto` |
| [onboard-person](.agents/skills/onboard-person/SKILL.md)       | Create/enrich a `@Name.md` from external sources (ATS / profile) | `<Name>`, `--candidate` |
| [last-1on1](.agents/skills/last-1on1/SKILL.md)                 | Flag overdue 1:1s by recency (Meetings.base OneOnOnes view) | `<weeks>`, `@Name` |
| [vault-health](.agents/skills/vault-health/SKILL.md)           | Audit unresolved links, orphans, deadends, sync conflicts | `unresolved`, `orphans`, `deadends`, `sync`, `--fix-people` |
| [migrate-tags](.agents/skills/migrate-tags/SKILL.md)           | Migrate body `#hashtags` to frontmatter `tags:` lists | `<path>`, `--dry-run`, `--strip-body` |
| [workspace-mode](.agents/skills/workspace-mode/SKILL.md)       | Switch named Obsidian Workspace layouts | `<name>`, `save <name>` |
| [sprint-retro](.agents/skills/sprint-retro/SKILL.md)           | Synthesize a Sprint Retro draft from vault sources | `<N>`, `<dates>` |
| [termy-obsidian-context](.agents/skills/termy-obsidian-context/SKILL.md) | Read the live Obsidian note from a Termy session | |

### Skill proxies (symlinks to `.agents/skills/`)

The canonical skill tree is **`.agents/skills/`**. These paths are symlinks to the same directory so each agent discovers the same skills:

| Path | Used by |
| --- | --- |
| [`.cursor/skills`](.cursor/skills) | Cursor |
| [`.claude/skills`](.claude/skills) | Claude Code |
| [`.opencode/skills`](.opencode/skills) | OpenCode |
| [`skills/`](skills) | OpenClaw ([workspace `skills`](https://docs.openclaw.ai/skills/)) |

OpenCode also discovers `.agents/skills/` directly; the `.opencode/skills` link matches the Cursor / Claude layout.

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
| OpenClaw | `AGENTS.md` (and your gateway config) | Rules live in `.agents/rules/`; skills via repo `skills/` → `.agents/skills/` |

## Vault Layout

```
Meetings/              Meeting notes by subfolder (Engineering/, One-on-ones/, Interviews/, etc.)
Templates/             Obsidian templates
Teams/People/          Person files: @Name.md
Teams/                 Team files: +TeamName.md
ToDo's.md              Aggregated Tasks plugin view
Tracker.md             Optional project tracker (omit if using Jira/etc.)
```

## Conventions

- **User**: See [USER.md](USER.md) for identity, timezone, aliases, and agent behavior rules.
- **Frontmatter**: YAML between `---` fences. `modified:` is managed by Obsidian — never set manually.
- **Participants**: `[[@Name]]` wikilinks (people) or `[[+Team]]` (teams).
- **AI Transcripts**: Cached under `## 🤖 AI Notes` with provider subheadings and collapsible callouts (`[!gemini_notes]-`, `[!gemini_todos]-`, `[!gemini_transcript]-`).
- **Tasks priorities**: 🔺 highest, ⏫ high, 🔼 medium, 🔽 low.

## MCP & external tools

- **QMD** — Configured in [.cursor/mcp.json](.cursor/mcp.json) for vault search (MCP server `npx qmd mcp`).
- **Google Workspace** — Use the **`gws` CLI** ([Google Workspace CLI](https://github.com/googleworkspace/cli)) for Docs, Drive, Calendar, and Gmail in read-only workflows. See [README.md](README.md) § Google Workspace CLI and [.agents/skills/_shared/google-workspace-cli.md](.agents/skills/_shared/google-workspace-cli.md).

## Syncing from Upstream

If you forked or cloned this repo into a private vault, you can pull structural updates (skills, rules, shared conventions) without overwriting your personal data.

```bash
./.scripts/sync-upstream.sh              # fetch + merge
./.scripts/sync-upstream.sh --preview    # see what's new without merging
```

First-time setup:

```bash
git remote add upstream <url-to-this-repo>
./.scripts/sync-upstream.sh              # auto-configures merge driver on first run
```

Protected paths (always keep local version during merge): `USER.md`, `Tracker.md`, `.env`, `.cursor/mcp.json`, `Meetings/`, `Teams/`, `Templates/`, `Recaps/`. Edit `.gitattributes` to add or remove paths.
