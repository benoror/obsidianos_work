---
name: fill-participants
description: "Resolve and fill Participants frontmatter + link unlinked names in body. Args: <path>, all."
---

# Fill Participants

## Usage

- `/fill-participants all` — Scan all meetings, find those missing Participants, resolve and fill them.
- `/fill-participants <path>` — Fill participants for a specific meeting note (relative to workspace root, e.g. `Meetings/PAM/Some Meeting.md`).

## Workspace Layout

```
Meetings/          # All meeting notes, organized by subfolder
Teams/People/      # Person files: @Name.md with frontmatter (FullName, Team, Location, Office)
Teams/             # Team files: +TeamName.md (e.g. +PAM.md, +Data.md, +QA.md)
Meetings.base      # Obsidian DB view config — Participants is a frontmatter property
People.base        # Obsidian DB view config — People have Team, FullName, Location, Office
```

## Frontmatter Conventions

Participants live in YAML frontmatter as either:

```yaml
# Single participant
Participants: "[[@Zak]]"

# Multiple participants
Participants:
  - "[[@Zak]]"
  - "[[@Carlos García]]"

# Team-wide meetings
Participants: "[[+PAM]]"

# Team-level shorthand for large-group meetings
Participants: "[[+Eng]]"
```

Person links use `[[@Name]]` matching filenames in `Teams/People/` (without the `.md`).
Team links use `[[+TeamName]]` matching filenames in `Teams/` (without the `.md`).

## Workflow

### Step 1: Identify targets

See [vault-context](../_shared/vault-context.md) for vault discovery conventions.

**Mode A (`all`):**
1. Discover meeting files using QMD: `qmd-multi_get` with glob `Meetings/**/*.md` to list all meetings (any naming format).
2. For each file, read frontmatter and check if `Participants:` exists — files that have it are already done.
3. The difference is the set of files missing Participants.

**Mode B (specific file):**
1. Read the specified file.
2. Check if Participants already exists in frontmatter. If so, inform user and stop (or ask if they want to override).

### Step 2: Gather participant info for each target

For each meeting missing Participants, determine attendees using this priority:

1. **Google Docs Notes** — If the frontmatter has a `Notes:` property with a `docs.google.com/document/d/` URL, extract the document ID and call `google-workspace-get_doc_as_markdown` (email: check frontmatter or use workspace default). Gemini meeting summaries name participants explicitly. Note: Gemini anonymizes some speakers as "someone in [location]" — cross-reference with known people.

2. **File name** — Names in `X x Y` patterns (e.g. "Chris x Ben 2026-02-10.md") directly indicate participants.

3. **File content** — Look for `[[@Name]]` references in the body.

4. **Folder conventions** — Files under `Meetings/PAM/Scrum/` are typically `[[+PAM]]` meetings (daily standups, sprint planning, retros, grooming).

5. **Similar meetings** — Check if a recurring meeting (same name, different date) already has Participants set, and reuse that pattern.

6. **Tracker.md** — Read `Tracker.md` and scan for `[[@Name]]` wikilinks associated with Jira tickets mentioned in the meeting note. This helps resolve ambiguous names (e.g. Gemini's "someone in [location]") when a ticket assignee matches the context.

### Step 3: Match names to People.base

- Read all files in `Teams/People/` to build a name lookup (filename → FullName).
- Match names from Google Docs against both `@Filename` and `FullName` property.
- Flag any unmatched names for user confirmation.

### Step 4: Present findings and ask for confirmation

Present results grouped into:

1. **Confident matches** — Table of meeting → proposed Participants. Apply without asking.
2. **Needs confirmation** — Ambiguous matches, unknown people, or meetings with only Otter.ai links (no Google Doc). Ask the user.
3. **New people** — Names not in People.base. Ask which Team they belong to, then create the `@Name.md` file.

Also flag if any existing `@Person.md` files are missing key properties (FullName, Team) that were discovered from Google Docs.

### Step 5: Link unlinked names in note body

Scan the **entire file content** (body + AI transcript callouts) for mentions of people that are not already wrapped in `[[@Name]]` wikilinks. This catches plain-text references from Gemini transcripts and manual notes.

#### 5a: Build a name dictionary

From `Teams/People/`, build a lookup of all possible name variants for each person:

| Source | Example | Matches `@Rob.md` |
|--------|---------|-------------------|
| Filename (without `@` and `.md`) | `Rob` | Yes |
| `FullName` frontmatter | `Rob Klock` | Yes |
| First name (from FullName) | `Rob` | Yes |
| First name (from filename) | `Rob` | Yes |
| Common nicknames | — | Only if explicitly listed in person file |

Also match names preceded by `@` that aren't already wikilinks (e.g. `@Rob` but not `[[@Rob]]`).

#### 5b: Scan for unlinked mentions

Search the note body for each name variant. Skip matches that:
- Are already inside `[[@...]]` wikilinks
- Are inside frontmatter (`---` fences)
- Are partial word matches (e.g. "Robert" should not match "Rob" — use word boundary matching)
- Are inside URLs or code blocks

#### 5c: Present matches for confirmation

**⚠️ MANDATORY: Always prompt the user before replacing. Never auto-replace — false positives are common with first names and nicknames.**

Display a numbered table of proposed replacements:

```
| # | Replace? | Found text | → Link | Context (surrounding text) |
|---|----------|------------|--------|---------------------------|
| 1 | ✅ | Rob Klock | [[@Rob]] | "...assigned Rob Klock a bug ticket..." |
| 2 | ✅ | @Zach | [[@Zak]] | "...recent changes made by @Zach..." |
| 3 | ⬜ | Victor | [[@Victor]] | "...Victor confirmed they have been..." |
| 4 | ⬜ | Ben | — (skip, it's the user) | "...Your Name and Ben agreed..." |
```

- Default `✅` for full-name matches (high confidence).
- Default `⬜` for first-name-only or nickname matches (need confirmation).
- Always skip linking the user's own name (Your Name / Ben) — these don't need wikilinks.
- Show a short context snippet so the user can judge correctness.
- Let the user toggle by saying numbers (e.g. "1,2" or "all" or "none").

#### 5d: Apply confirmed replacements

Use `StrReplace` for each confirmed match. When a name appears multiple times, ask the user if they want to replace all occurrences or specific ones.

### Step 6: Apply frontmatter changes

For each file, add `Participants:` to the YAML frontmatter just before the closing `---`. Use `StrReplace` targeting a unique anchor (last line before `---`).

### Step 7: Handle intentionally blank meetings

For meetings where participants genuinely can't be determined:
- Use **team links** where the meeting clearly belongs to a team (e.g. `[[+QA]]`, `[[+Eng]]`).
- Use **`—`** (em-dash) as the universal "intentionally left blank" marker for true unknowns.
- Never leave the field absent — every meeting should end up with a Participants value.

## Step 8: Offer to commit

See [/commit](../commit/SKILL.md). Skip when called as part of a sequence (e.g. `/meeting wrap`).

## Important Notes

- Always read a file before editing it — frontmatter may have been modified by Obsidian sync.
- The `modified:` timestamp in frontmatter changes frequently via iCloud sync; use other properties as unique anchors for StrReplace.
- Batch edits where possible to minimize round-trips, but never edit a file without reading it first.
- Interview notes use the **co-interviewer** (not the candidate) as Participants. If it was a solo interview, use `[[@Me]]`.
- This workspace may not be a git repo. If `git status` fails, skip the commit step entirely without error.
