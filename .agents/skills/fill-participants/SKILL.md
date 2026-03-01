---
name: fill-participants
description: "Resolve and fill Participants frontmatter + link unlinked names in body. Args: <path>, all."
license: MIT
compatibility: google-workspace MCP (Docs, optional — enhances name resolution from Gemini notes)
---

# Fill Participants

## Usage

- `/fill-participants all` — Scan all meetings, find those missing Participants, resolve and fill them.
- `/fill-participants <path>` — Fill participants for a specific meeting note (relative to workspace root, e.g. `Meetings/PAM/Some Meeting.md`).

## Frontmatter Conventions

See [people-resolver](../_shared/people-resolver.md) for wikilink format and name matching rules.

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
```

## Workflow

### Step 1: Identify targets

**Mode A (`all`):**

Run [/note-status pending --step=participants](../note-status/SKILL.md#pending-mode) to discover notes missing `Participants:`, present them, and let the user select which to process.

**Mode B (specific file):**
1. Read the specified file.
2. Check if Participants already exists in frontmatter. If so, inform user and stop (or ask if they want to override).

### Step 2: Gather participant info for each target

For each meeting missing Participants, determine attendees using the resolution priority defined in [people-resolver](../_shared/people-resolver.md). In summary:

1. **Google Docs Notes** — Gemini summaries name participants explicitly. Extract doc ID from `Notes:` frontmatter and call `google-workspace-get_doc_as_markdown`.
2. **File name** — `X x Y` patterns.
3. **File content** — Existing `[[@Name]]` references.
4. **Folder conventions** — e.g. `Meetings/PAM/Scrum/` → `[[+PAM]]`.
5. **Similar meetings** — Recurring meeting with same name, different date.
6. **Tracker.md** — Jira ticket assignees for disambiguation.

### Step 3: Match names to People files

Build a name dictionary per [people-resolver](../_shared/people-resolver.md). Match names from Google Docs against the dictionary. Flag any unmatched names for user confirmation.

### Step 4: Present findings and ask for confirmation

Present results grouped into:

1. **Confident matches** — Table of meeting → proposed Participants. Apply without asking.
2. **Needs confirmation** — Ambiguous matches, unknown people, or meetings with only Otter.ai links (no Google Doc). Ask the user.
3. **New people** — Names not in People files. See [people-resolver](../_shared/people-resolver.md) § "Creating New People".

Also flag if any existing `@Person.md` files are missing key properties (FullName, Team) that were discovered from Google Docs.

### Step 5: Link unlinked names in note body

Scan the **entire file content** (body + AI transcript callouts) for mentions of people that are not already wrapped in `[[@Name]]` wikilinks. This catches plain-text references from Gemini transcripts and manual notes.

#### 5a: Build a name dictionary

Use the name dictionary and matching rules from [people-resolver](../_shared/people-resolver.md).

#### 5b: Scan for unlinked mentions

Search the note body for each name variant, following the word boundary and skip rules in [people-resolver](../_shared/people-resolver.md).

#### 5c: Present matches for confirmation

**⚠️ MANDATORY: Always prompt the user before replacing. Never auto-replace — false positives are common with first names and nicknames.**

Display a numbered table of proposed replacements:

```
| # | Replace? | Found text | → Link | Context (surrounding text) |
|---|----------|------------|--------|---------------------------|
| 1 | ✅ | Rob Klock | [[@Rob]] | "...assigned Rob Klock a bug ticket..." |
| 2 | ✅ | @Zach | [[@Zak]] | "...recent changes made by @Zach..." |
| 3 | ⬜ | Victor | [[@Victor]] | "...Victor confirmed they have been..." |
| 4 | ⬜ | Alex | — (skip, it's the user) | "...Alex Smith and Alex agreed..." |
```

- Default `✅` for full-name matches (high confidence).
- Default `⬜` for first-name-only or nickname matches (need confirmation).
- Always skip linking the vault owner's name (see `USER.md` Identity) — these don't need wikilinks.
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
- The `modified:` timestamp in frontmatter changes frequently; use other properties as unique anchors for StrReplace.
- Batch edits where possible to minimize round-trips, but never edit a file without reading it first.
- Interview notes use the **co-interviewer** (not the candidate) as Participants. If it was a solo interview, use `[[@Me]]`.
- This workspace may not be a git repo. If `git status` fails, skip the commit step entirely without error.
