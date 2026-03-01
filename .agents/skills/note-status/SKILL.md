---
name: note-status
description: "Verify meeting notes are fully processed. Args: <path>, [dates], all, pending [dates] [--step=X]. Shows which wrap steps are complete or missing."
---

# Note Status

## Usage

- `/note-status <path>` — Check processing status of a specific meeting note.
- `/note-status [dates]` — Check all meeting notes matching a date filter.
- `/note-status all` — Check every meeting note in the vault.
- `/note-status` (no args) — Defaults to `this week`.
- `/note-status pending [dates] [--step=<step>]` — Filter to actionable pending notes and prompt the user to select which ones to act on. See [Pending Mode](#pending-mode).

## Processing Checklist

A meeting note is **fully processed** when all four frontmatter properties are present:

| Step | Property | Set by | Requires |
|------|----------|--------|----------|
| `notes` | `Notes:` with URLs (not empty/absent) | User or `/cache-notes` prompt | — |
| `cache` | `NotesCached:` | `/cache-notes` | `notes` with a supported provider URL |
| `participants` | `Participants:` | `/fill-participants` | — |
| `todos` | `TodosExtracted:` | `/followup-todos` | — |

A note is **pending** when any of these are missing.

### Detection Rules

- `Notes:` counts as missing if the property is absent, empty, or contains no URLs.
- `NotesCached:` counts as missing if absent. Presence of the timestamp (any value) means cached.
- `Participants:` counts as missing if absent. Presence (even `—`) means filled.
- `TodosExtracted:` counts as missing if absent. Presence of the timestamp means extracted.

### Dependency Chain

Some steps have prerequisites. A note is **actionable** for a step only when the step is missing *and* its prerequisites are met:

| Step | Actionable when |
|------|-----------------|
| `notes` | `Notes:` absent/empty — always actionable |
| `cache` | `NotesCached:` absent **and** `Notes:` contains at least one supported provider URL (e.g. `docs.google.com`). Notes with only unsupported URLs (e.g. Otter-only) are not actionable for caching. |
| `participants` | `Participants:` absent — always actionable |
| `todos` | `TodosExtracted:` absent — always actionable |

The dependency chain matters for `--step` filtering (see Pending Mode) and for the status table, where a step can be shown as ❌ (missing but actionable), ⏸️ (missing, blocked by prerequisite), or ✅ (done).

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
| 1 | Meetings/PAM/Some Meeting - 2026-02-20.md | ❌ | ⏸️ | ❌ | ❌ | 2026-02-20 |
| 2 | Meetings/Eng/Sync - 2026-02-22.md | ✅ | ✅ | ❌ | ❌ | 2026-02-22 |
| 3 | Meetings/PAM/Scrum/2026-02-25.md | ✅ | ❌ | ✅ | ❌ | 2026-02-25 |
```

- ✅ = done
- ❌ = missing and actionable
- ⏸️ = missing but blocked (prerequisite not met)

After the table, print a summary line:

```
3 notes checked — 0 fully processed, 3 pending
```

## Pending Mode

**Input**: `/note-status pending [dates] [--step=<step>]`

Filters to notes that are pending, presents them, and prompts the user to select which ones to act on. This is the common entry point used by other skills' batch modes.

### Step filtering (`--step`)

When `--step` is provided, only show notes where that specific step is **actionable** (missing *and* prerequisites met, per the Dependency Chain). Valid values: `notes`, `cache`, `participants`, `todos`.

When `--step` is omitted, show notes where *any* step is missing (what `/meeting wrap pending` needs).

### Workflow

1. Run the standard workflow (Steps 1–4 above) with the given `[dates]` or `all` if omitted.
2. **Filter** — if `--step` is set, keep only notes where that step is actionable. Otherwise keep notes where any step is missing.
3. **Present** the filtered table to the user.
4. **Prompt** the user to select which notes to act on (e.g. "all", "1,3", "none").
5. **Return** the user's selection as the list of file paths. The calling skill iterates over them.

### Callers

| Caller | Invocation | What it does with the selection |
|--------|------------|---------------------------------|
| `/meeting wrap pending [dates]` | `/note-status pending [dates]` | Runs full wrap sequence on each |
| `/cache-notes all` | `/note-status pending --step=cache` | Caches each selected note |
| `/fill-participants all` | `/note-status pending --step=participants` | Fills participants for each |
| `/followup-todos` (no args) | `/note-status pending --step=todos` | User picks one to extract todos from |

## Important Notes

- This is a **read-only** skill — it never modifies files.
- Always read a file before checking — frontmatter may have changed since last indexed by QMD.
- Do NOT skip files that look "empty" — a note with only frontmatter still needs status tracking.
- Files outside `Meetings/` are ignored.
