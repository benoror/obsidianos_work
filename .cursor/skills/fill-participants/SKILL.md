---
name: fill-participants
description: Fills missing Participants frontmatter in Obsidian meeting notes. Scans Meetings/ for notes without Participants, resolves names from Google Docs via MCP, matches against People.base and Teams, and applies changes with user confirmation. Use when the user says /fill-participants, asks to fill participants, or wants to update meeting attendees.
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

**Mode A (`all`):**
1. List all `.md` files under `Meetings/`.
2. Grep for files that have `^Participants:` — these already have it.
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

### Step 5: Apply changes

For each file, add `Participants:` to the YAML frontmatter just before the closing `---`. Use `StrReplace` targeting a unique anchor (last line before `---`).

### Step 6: Handle intentionally blank meetings

For meetings where participants genuinely can't be determined:
- Use **team links** where the meeting clearly belongs to a team (e.g. `[[+QA]]`, `[[+Eng]]`).
- Use **`—`** (em-dash) as the universal "intentionally left blank" marker for true unknowns.
- Never leave the field absent — every meeting should end up with a Participants value.

## Step 7: Offer to commit changes

After all edits are applied, ask the user if they'd like to commit the changes.

- Only stage files that were actually modified (meeting notes with new Participants, new/updated People files).
- Do NOT stage unrelated files that may have changed via iCloud sync.
- Use `git add` with explicit file paths — never `git add .` or `git add -A`.
- Default commit message: `update: /fill-participants <argument>` where `<argument>` is `all` or the specific meeting path.
- Present the list of files that will be staged and the commit message. Wait for user confirmation before committing.
- If the user declines, skip the commit silently.

Example flow:

```
I've updated 35 meeting files and 3 People files. Want me to commit these changes?

Files to stage:
  - Meetings/PAM/Scrum/2026-02-09.md (+ 14 more)
  - Teams/People/@Thomas Barrett.md (new)
  - Teams/People/@Courtney.md (updated)

Commit message: "update: /fill-participants all"

[Yes / No]
```

## Important Notes

- Always read a file before editing it — frontmatter may have been modified by Obsidian sync.
- The `modified:` timestamp in frontmatter changes frequently via iCloud sync; use other properties as unique anchors for StrReplace.
- Batch edits where possible to minimize round-trips, but never edit a file without reading it first.
- Interview notes use the **co-interviewer** (not the candidate) as Participants. If it was a solo interview, use `[[@Me]]`.
- This workspace may not be a git repo. If `git status` fails, skip the commit step entirely without error.
