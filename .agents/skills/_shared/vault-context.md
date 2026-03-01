---
name: vault-context
description: "Shared convention for gathering vault context via QMD. Referenced by skills that need to search meeting notes, tracker, or other vault content."
license: MIT
---

# Vault Context — Shared Convention

This is not a standalone skill. It defines how any skill should gather context from the vault when it needs to search, discover, or read vault content for a given date range or topic.

Skills reference this convention with:

```markdown
See [vault-context](../_shared/vault-context.md) for how to gather vault notes.
```

## Core Rule

**Always use QMD** (`qmd-search`, `qmd-vector_search`, `qmd-get`, `qmd-multi_get`) for vault discovery. Never use `grep`, `find`, `Glob`, or `Grep` to discover vault content by topic or date — those tools are only for exact-string frontmatter lookups (e.g. checking if `NotesCached:` exists).

## Key Vault Sources

Every skill gathering vault context MUST consider these sources:

| Source | Path | Contains |
|--------|------|----------|
| Meeting notes | `Meetings/**/*` | All meeting notes, any naming format. Includes subfolders (PAM/, Scrum/, TBs/, Eng/, etc.) |
| Tracker | `Tracker.md` | Sprint/week-level task tracker with Jira links, status, assignees, and progress notes |

Skills MAY also pull from additional sources when relevant:

| Source | Path | Contains |
|--------|------|----------|
| People | `Teams/People/@Name.md` | Person files with FullName, Team, Location |
| Teams | `Teams/+TeamName.md` | Team membership |
| Recaps | `Recaps/*.md` | Previous recap summaries (avoid circular reference — only read, don't re-summarize) |
| ToDo's | `ToDo's.md` | Aggregated Tasks plugin view |

## Gathering by Date Range

When a skill needs vault content for a date range (`start_date` to `end_date`):

### Step 1: Search via QMD

Run searches in parallel:

1. **Keyword search** (`qmd-search`): Search for each date in the range as `YYYY-MM-DD` (filenames contain dates in this format). For ranges longer than 7 days, search by `YYYY-MM` prefix instead.
2. **Semantic search** (`qmd-vector_search`): Search for the topic or purpose if applicable (e.g. "sprint planning", "data lake migration").
3. **Batch retrieve** (`qmd-multi_get`): Glob `Meetings/**/*` files and filter by date in content or filename.

### Step 2: Always include Tracker.md

Read `Tracker.md` via `qmd-get` (or `Read` tool). Extract the section(s) relevant to the date range — typically the current sprint/week heading and its sub-items. The Tracker contains:

- Jira ticket references (`[PAMENG-XXXX](url)`)
- Task status (`- [ ]`, `- [x]`, `- [/]`, `- [-]`)
- Assignee wikilinks (`[[@Name]]`)
- Sub-task breakdowns and scope change notes

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
4. **Always check Tracker.md**: Scan for mentions of the topic — it often has the authoritative status of ongoing work items.

## What NOT to Do

- Do NOT use `Glob` or `grep` to find meeting notes by filename pattern — QMD indexes content and metadata, making it the better discovery tool.
- Do NOT skip `Tracker.md` — it provides sprint-level context that meeting notes alone don't capture.
- Do NOT read every file in `Meetings/` sequentially — use QMD to narrow down, then read only the relevant files.
- Do NOT assume a specific filename format for meetings — they vary (`YYYY-MM-DD.md`, `Title - YYYY-MM-DD.md`, free-form names).
