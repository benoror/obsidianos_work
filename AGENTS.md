# Agents

This is an Obsidian vault managed by Your Name. AI agents working in this repo should be aware of the following structure and conventions.

## Skills

Custom Cursor skills live in `.cursor/skills/`. Each has a `SKILL.md` with usage, workflow, and conventions.

| Skill | What it does | Arguments |
|-------|--------------|-----------|
| [meeting](.cursor/skills/meeting/SKILL.md) | Create a meeting note | |
| ├ `/meeting {title}` | Manual creation with today's date | `folder={subfolder}` |
| ├ `/meeting` | Pick from today's Google Calendar events | |
| ├ `/meeting wrap <path>` | Wrap up: cache → participants → todos → commit | |
| └ `/meeting wrap pending [dates]` | Find & wrap all pending meetings | `today`, `yesterday`, `last week`, `2026-01-01..2026-02-03` |
| [cache-notes](.cursor/skills/cache-notes/SKILL.md) | Fetch & embed AI transcripts as Obsidian callouts | |
| ├ `/cache-notes <path>` | Cache a specific meeting file (prompts for URLs if empty) | |
| ├ `/cache-notes all` | Batch-cache all uncached meetings | |
| └ `/cache-notes refresh <path>` | Re-fetch and overwrite existing cache | |
| [fill-participants](.cursor/skills/fill-participants/SKILL.md) | Resolve and fill `Participants:` frontmatter | |
| ├ `/fill-participants <path>` | Fill for a specific meeting note | |
| └ `/fill-participants all` | Scan and fill all meetings missing participants | |
| [followup-todos](.cursor/skills/followup-todos/SKILL.md) | Extract action items as Obsidian Tasks checkboxes | |
| ├ `/followup-todos <path>` | Extract from a specific meeting note | |
| └ `/followup-todos` | Pick from recent meetings | |
| [commit](.cursor/skills/commit/SKILL.md) | Stage modified files and commit with confirmation | |
| ├ `/commit` | Standalone — commit pending changes from any skill | |
| └ *(sequence mode)* | Deferred — sub-skills skip, caller commits once at the end | |

## Rules

Cursor rules in `.cursor/rules/` are auto-injected based on glob patterns.

| Rule | Applies to | Purpose |
|------|-----------|---------|
| [skill-conventions](.cursor/rules/skill-conventions.mdc) | `.cursor/skills/**` | Enforces skill structure, commit step, Obsidian Tasks priorities, and project context |
| [skill-registry](.cursor/rules/skill-registry.mdc) | `.cursor/skills/*/SKILL.md` | Keeps skill tables in `skill-conventions.mdc` and `AGENTS.md` in sync when skills change |

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

- **Frontmatter**: YAML between `---` fences. `modified:` is managed by Obsidian — never set manually.
- **Participants**: `[[@Name]]` wikilinks (people) or `[[+Team]]` (teams).
- **AI Transcripts**: Cached under `## 🤖 AI Notes` with provider subheadings and collapsible callouts (`[!gemini_notes]-`, `[!gemini_todos]-`, `[!gemini_transcript]-`).
- **Tasks priorities**: 🔺 highest, ⏫ high, 🔼 medium, 🔽 low.
- **Timezone**: `-06:00` (CST).
- **User**: Your Name / "Ben".

## MCP Servers

Configured in [.cursor/mcp.json](.cursor/mcp.json). Provides Google Workspace tools (Docs, Drive, Calendar).
