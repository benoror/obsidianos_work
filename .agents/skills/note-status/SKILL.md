---
name: note-status
description: "Verify meeting notes are fully processed. Args: <path>, [dates], all. Shows which wrap steps are complete or missing."
---

# Note Status

## Usage

- `/note-status <path>` — Check processing status of a specific meeting note.
- `/note-status [dates]` — Check all meeting notes matching a date filter.
- `/note-status all` — Check every meeting note in the vault.
- `/note-status` (no args) — Defaults to `this week`.

## Processing Checklist

A meeting note is **fully processed** when all four frontmatter properties are present:

| Step | Property | Set by | Meaning |
|------|----------|--------|---------|
| Notes URLs | `Notes:` with URLs (not empty/absent) | User or `/cache-notes` prompt | External resource links added |
| Cache | `NotesCached:` | `/cache-notes` | AI transcripts fetched and embedded |
| Participants | `Participants:` | `/fill-participants` | Attendees resolved to wikilinks |
| Todos | `TodosExtracted:` | `/followup-todos` | Action items extracted |

A note is **pending** when any of these are missing.

### Detection Rules

- `Notes:` counts as missing if the property is absent, empty, or contains no URLs.
- `NotesCached:` counts as missing if absent. Presence of the timestamp (any value) means cached.
- `Participants:` counts as missing if absent. Presence (even `—`) means filled.
- `TodosExtracted:` counts as missing if absent. Presence of the timestamp means extracted.

## Date Filtering

See [date-filter](../_shared/date-filter.md) for the full syntax and date parsing rules.

When `[dates]` is provided, only consider meetings whose date matches. Default (no args): `this week`.

## Workflow

See [vault-context](../_shared/vault-context.md) for vault discovery conventions.

### Step 1: Discover meeting files

- **Specific file** (`<path>`): Read that file directly.
- **Date-filtered** (`[dates]`): Use QMD — `qmd-search` for `YYYY-MM-DD` date strings in the range under `Meetings/`. For ranges longer than 7 days, search by `YYYY-MM` prefix.
- **All**: Use `qmd-multi_get` with glob `Meetings/**/*.md`.

### Step 2: Read frontmatter

For each discovered file, read its YAML frontmatter and check for the four properties in the Processing Checklist.

### Step 3: Filter by date

If `[dates]` was provided, extract the date from the filename (`YYYY-MM-DD` pattern — files use varying formats, don't assume a specific naming convention). Discard files outside the range.

### Step 4: Present status table

Display results as a table, sorted oldest-first by date:

```
| # | File | Notes | Cached | Participants | Todos | Date |
|---|------|-------|--------|--------------|-------|------|
| 1 | Meetings/PAM/Some Meeting - 2026-02-20.md | ❌ | ❌ | ❌ | ❌ | 2026-02-20 |
| 2 | Meetings/Eng/Sync - 2026-02-22.md | ✅ | ✅ | ❌ | ❌ | 2026-02-22 |
| 3 | Meetings/PAM/Scrum/2026-02-25.md | ✅ | ❌ | ✅ | ❌ | 2026-02-25 |
```

After the table, print a summary line:

```
3 notes checked — 0 fully processed, 3 pending
```

### Step 5: Return structured results

When called programmatically by another skill (e.g. `/meeting wrap pending`), the results are the list of files with their per-step status. The caller decides what to do with them.

## Important Notes

- This is a **read-only** skill — it never modifies files.
- Always read a file before checking — frontmatter may have changed since last indexed by QMD.
- Do NOT skip files that look "empty" — a note with only frontmatter still needs status tracking.
- Files outside `Meetings/` are ignored.
