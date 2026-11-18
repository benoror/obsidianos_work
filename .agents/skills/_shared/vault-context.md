---
name: vault-context
description: "Shared convention for gathering vault context via QMD. Referenced by skills that need to search meeting notes, optional tracker, or other vault content."
license: MIT
---

# Vault Context — Shared Convention

This is not a standalone skill. It defines how any skill should gather context from the vault when it needs to search, discover, or read vault content for a given date range or topic.

Skills reference this convention with:

```markdown
See [vault-context](../_shared/vault-context.md) for how to gather vault notes.
```

## Core Rule

**Always use QMD or Obsidian Bases for vault discovery.** Never use `grep`, `find`, `Glob`, or `Grep` to discover vault content by topic or date.

Pick the right tool for the lookup shape:

| Need | Tool | Why |
|------|------|-----|
| Saved/recurring query a skill runs every invocation | `obsidian base:query path=<X>.base view=<view>` | Obsidian indexes Bases on file change — instant, no reindex lag. See `Meetings.base` (Pending, Inbox, CachePending, etc.) and `People.base` (Active, per-team, etc.). |
| Semantic / "what's like this" search | `qmd-vector_search` | Embedding-based — handles paraphrasing, synonyms, novel wording. |
| Known string + surrounding lines | `obsidian search:context query=<str> lines=2` | Faster than vector search for exact-string lookups. Returns line context. |
| Known string, paths only | `obsidian search query=<str>` or `qmd-search` | Either works; `obsidian search` is faster for live data. |
| Read multiple files at once | `qmd-multi_get` (glob) or `obsidian files path=<dir>` | Avoid one-at-a-time reads. |
| Exact-string frontmatter check on already-identified files | `obsidian property:read` or `grep` | OK to use grep here — it's a known-file lookup, not vault discovery. |

## Key Vault Sources

Every skill gathering vault context MUST consider these sources:

| Source | Path | Contains |
|--------|------|----------|
| Meeting notes | `Meetings/**/*` | All meeting notes, any naming format. Includes subfolders (Engineering/, Scrum/, One-on-ones/, etc.) |

Skills MAY also pull from additional sources when relevant:

| Source | Path | Contains |
|--------|------|----------|
| People | `Teams/People/@Name.md` | Person files with FullName, Team, Location |
| Teams | `Teams/+TeamName.md` | Team membership |
| Recaps | `Recaps/*.md` | Previous recap summaries (avoid circular reference — only read, don't re-summarize) |
| ToDo's | `ToDo's.md` | Aggregated Tasks plugin view |
| Tracker (optional) | `Tracker.md` and/or `Trackers/*.md` | Optional vault-local sprint board — see [Ticket / sprint status](#ticket--sprint-status) |

## Ticket / sprint status

`Tracker.md` is an **optional** ObsidianOS feature. Use it when you want a vault-local board; omit or archive it when an external system (e.g. Jira) is the source of record.

| Priority | Source | When |
|----------|--------|------|
| 1 | External issue tracker (e.g. Jira via Atlassian MCP) | When configured — authoritative for ticket status |
| 2 | **Live Tracker** | If `Tracker.md` / `Trackers/*.md` exists and is not deprecated/archived |
| 3 | Meeting notes / recaps | Narrative context only |

Skip archived/stub trackers. Skills must not require Tracker to exist.

## Gathering by Date Range

When a skill needs vault content for a date range (`start_date` to `end_date`):

### Step 1: Search via QMD

Run searches in parallel:

1. **Keyword search** (`qmd-search`): Search for each date in the range as `YYYY-MM-DD` (filenames contain dates in this format). For ranges longer than 7 days, search by `YYYY-MM` prefix instead.
2. **Semantic search** (`qmd-vector_search`): Search for the topic or purpose if applicable (e.g. "sprint planning", "data lake migration").
3. **Batch retrieve** (`qmd-multi_get`): Glob `Meetings/**/*` files and filter by date in content or filename.

### Step 2: Ticket status (optional Tracker)

1. Prefer an external tracker (e.g. Jira) when configured.
2. If a **live** `Tracker.md` / `Trackers/*.md` exists, include it — weeks/sprints, priorities, pause notes.
3. If neither is available, continue from meeting notes alone.

### Step 3: Read matched files

For each matched meeting note, extract:

- **Title and date** (from filename)
- **Participants** (from frontmatter)
- **Key content**: manual notes between frontmatter and `## 🤖 AI Notes`
- **AI summaries**: prefer `[!gemini_notes]` callout content (already distilled) over raw transcript
- **Existing todos**: `- [ ]` and `- [x]` lines

### Step 4: Deduplicate

The same file may appear in multiple QMD search results. Deduplicate by file path before reading.

## Gathering by Topic

When a skill needs vault content by topic (not date-bound):

1. **Semantic search** (`qmd-vector_search`): Describe what you're looking for in natural language.
2. **Keyword search** (`qmd-search`): Use specific terms, project names, Jira ticket IDs, or people names.
3. **Deep search** (`qmd-deep_search`): For broad or ambiguous topics where vocabulary is unknown.
4. **Optional Tracker**: If a live Tracker exists, scan it for the topic; do not fail if missing.

## What NOT to Do

- Do NOT use `Glob` or `grep` to find meeting notes by filename pattern — QMD indexes content and metadata, making it the better discovery tool.
- Do NOT require `Tracker.md` — it is optional; prefer an external SoR when configured.
- Do NOT read every file in `Meetings/` sequentially — use QMD to narrow down, then read only the relevant files.
- Do NOT assume a specific filename format for meetings — they vary (`YYYY-MM-DD.md`, `Title - YYYY-MM-DD.md`, free-form names).
