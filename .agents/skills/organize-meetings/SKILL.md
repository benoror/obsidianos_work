---
name: organize-meetings
description: Triage Meetings/_inbox/ — move each file to the correct subfolder by finding adjacent/similar notes via qmd, applying learned routing conventions from memory, and confirming with the user.
license: MIT
compatibility: Requires Obsidian CLI (base:query) with Obsidian running, Meetings.base (Inbox view), and qmd (CLI or MCP) for similarity search. Optional integration with `.scripts/gmail_ai_transcripts_to_meetings.py`.
---

# Organize Meetings

## Usage

- `/organize-meetings` — Sweep `Meetings/_inbox/` and propose destinations for every file.
- `/organize-meetings <path>` — Categorize a single file (in or out of `_inbox/`).
- `/organize-meetings --auto` — Apply only high-confidence proposals (≥ 4/5 majority); leave the rest in `_inbox/` for next sweep.

### When to run

| Caller | When |
|--------|------|
| **Standalone** | Whenever you want to drain `Meetings/_inbox/` (e.g. after `/mail-transcripts` created some stubs). |
| **`/meeting wrap pending`** | **Step 1.5** — between `/mail-transcripts` and pending discovery, so triaged files are included in the pending scan. |

## Why this skill exists

The Gemini-emailed archiver (`.scripts/gmail_ai_transcripts_to_meetings.py`) only knows deterministic patterns: daily standups, sprint ceremonies, recurring team meetings, etc. Everything name-dependent — 1:1s with anyone, cross-team syncs, novel meeting titles — lands in `Meetings/_inbox/` and waits here for triage.

Routing is **agent-driven, not script-driven**: similarity (via `qmd-vector_search`) finds where the new note's siblings live; **memory** (`feedback_meeting-routing.md`) captures learned exceptions so future runs apply them automatically.

## Frontmatter Conventions

Files in `_inbox/` are normal meeting notes with `Notes:` and `created:` frontmatter. The skill does not modify frontmatter — it only moves files (`git mv`) and updates the H1 inside when renaming.

## Workflow

### Step 1: Discover candidates

See [vault-context](../_shared/vault-context.md) for vault discovery conventions.

- **No args**: query the live Base view — `obsidian base:query path=Meetings.base view=Inbox format=paths`. Returns every file under `Meetings/_inbox/` (the `.gitkeep` is excluded automatically since it's not a `.md`).
- **`<path>` arg**: single-file mode — operate on that path.
- If the candidate list is empty, print `Nothing to organize.` and exit.

### Step 2: Read memory for learned conventions

Check `memory/feedback_meeting-routing.md` (if present). It contains routing hints the user has confirmed over time, e.g.:

> Titles with both "<name-a>" and "<name-b>" → `Meetings/Tech Syncs/` (not One-on-ones/), filename `<Name A> x <Name B> Sync - YYYY-MM-DD.md`.

Apply these **before** qmd similarity so they always win.

### Step 3: For each candidate, propose a destination

For each candidate file:

1. **Extract the title**: filename minus the trailing ` - YYYY-MM-DD.md` (or use the H1 inside the body if cleaner).
2. **Apply memory overrides** (Step 2). If a memory rule matches confidently, skip to Step 4 with `confidence = high (memory)`.
3. **Otherwise, run qmd-vector_search** on the title — return top 5 most similar meeting paths.
4. **Aggregate**:
   - Count how many of the 5 matches live in each folder. Pick the mode.
   - Inspect filenames in that folder to infer naming pattern:
     - All siblings end in ` - YYYY-MM-DD.md` → keep date suffix.
     - All siblings use `YYYY-MM-DD.md` only (e.g. `Engineering/Scrum/`) → use date-only.
     - Siblings share a prefix (e.g. `Tech Leads Weekly - `) → consider renaming to match.
5. **Score confidence**:
   | Match count | Confidence |
   |-------------|------------|
   | 5/5 or 4/5 same folder | **high** |
   | 3/5 same folder | **medium** |
   | < 3/5 or no matches | **low** |

### Step 4: Present proposals to the user — MANDATORY CONFIRMATION

**⚠️ Never move files without confirmation, except in `--auto` mode (where only high-confidence proposals run, low/medium skip).**

Display a numbered table:

```
| # | File | → Folder | New filename | Confidence | Reasoning |
|---|------|----------|--------------|------------|-----------|
| 1 | _inbox/Jane x Me - 2026-06-02.md | One-on-ones/ | Jane x Me - 2026-06-02.md | high (5/5 qmd) | siblings: John x Me, Alex x Me, Sam x Me |
| 2 | _inbox/PatMe Sync - 2026-06-02.md | Tech Syncs/  | PatMe Sync - 2026-06-02.md | high (memory)  | memory: Pat/Me → Tech Syncs |
| 3 | _inbox/Foo Bar - 2026-06-01.md    | ?            | ?                          | low (1/5 qmd)  | no clear majority — needs user |
```

Ask the user: "all", "high-confidence only", "1,3", "none", or per-file corrections (e.g. "2 → Engineering/").

### Step 5: Apply moves

For each approved proposal:

1. `git mv "<old path>" "<new path>"` — preserves history.
2. If the new filename differs from the old, update the H1 inside the file. Skip if H1 already matches the new filename.

### Step 6: Capture corrections to memory

When the user overrides a proposal ("don't put Pat/Me in One-on-ones, it goes to Tech Syncs"), this is **feedback worth saving**. Write or update `memory/feedback_meeting-routing.md`:

```yaml
---
name: meeting-routing-conventions
description: Learned routing rules for /organize-meetings — overrides qmd similarity
metadata:
  type: feedback
---

When triaging Meetings/_inbox/ via /organize-meetings:

- Titles containing both "<name-a>" and "<name-b>" → `Meetings/Tech Syncs/`.
  **Why:** It's a recurring manager sync, not a standard 1:1.
  **How to apply:** Apply before qmd similarity. Filename pattern: `<original> - YYYY-MM-DD.md`.

- (more learned rules append here over time)
```

Always include a **Why:** (the user's reasoning, if given) and **How to apply:** (the precondition + filename pattern). Capture one rule per bullet so future updates are atomic.

### Step 7: Commit

See [/commit](../commit/SKILL.md). Skip when called as part of `/meeting wrap pending` — the parent sequence commits at the end.

When called standalone: commit with `update: /organize-meetings — N files moved` (or similar). Skip if nothing was moved.

## Edge Cases

- **No qmd matches at all** (e.g. truly novel meeting type): low confidence. Ask the user; do NOT default to a folder.
- **Multiple folders tied**: low confidence. Ask the user.
- **File already wrapped** (`NotesCached`, `Participants`, `TodosExtracted` already set in frontmatter): still route it — wrapping doesn't lock the file location. Frontmatter survives the move.
- **H1 inside the file is generic** (e.g. just `# Meeting`): leave it alone; don't fabricate a new H1.
- **Filename collision** at destination: append `.dup-N` or ask the user.

## Important Notes

- Always use `git mv`, never `mv` — history matters.
- Never auto-move `low` confidence proposals, even in `--auto` mode.
- Memory entries are **cumulative**: append, don't overwrite. Each entry is a separate rule.
- If qmd's index is stale (a recent batch of renames hasn't been reindexed), low-confidence proposals may be common — note this in the proposal reasoning and suggest the user reindex.
- This skill does NOT modify the `Notes:`, `Participants:`, `NotesCached:`, or `TodosExtracted:` frontmatter. Those belong to `/cache-notes`, `/fill-participants`, and `/followup-todos`.
