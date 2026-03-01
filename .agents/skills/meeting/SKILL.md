---
name: meeting
description: "Create or wrap meeting notes. Args: {title} [folder=X], wrap <path>, wrap pending [today|this week|dates]. No args = pick from Google Calendar."
---

# Meeting

## Usage

- `/meeting {title}` — Create a meeting note with the given title and today's date.
- `/meeting {title} folder={subfolder}` — Create in a specific subfolder under `Meetings/`.
- `/meeting` (no args) — List today's Google Calendar events and let the user pick one. *(Requires Google Calendar MCP — see Setup below.)*
- `/meeting wrap <path>` — Wrap up an existing meeting by running `/cache-notes`, `/fill-participants`, and `/followup-todos` in sequence, with a single commit at the end.
- `/meeting wrap pending [<dates>]` — Find meetings missing any wrap step and wrap them in sequence. Optional date filter (see Mode D).

## File Naming

Format: `{Title} - YYYY-MM-DD.md`

Examples:
- `PAM - Weekly check-in - 2026-02-18.md`
- `Ben x Zak Sync - 2026-02-23.md`
- `Alert System Brainstorm and Requirement Gathering - 2026-02-06.md`

Exception — Scrum dailies in `Meetings/PAM/Scrum/` use just `YYYY-MM-DD.md`.

## Frontmatter

Every meeting note starts with YAML frontmatter:

```yaml
---
Notes:
created: YYYY-MM-DDTHH:MM:SS-06:00
---
```

- `Notes:` is left empty (populated later with Google Docs / Otter links).
- `created:` uses the current local timestamp in ISO 8601 with timezone offset.
- `Participants:` is intentionally omitted at creation time (filled later by `/fill-participants`).
- `modified:` is managed by Obsidian automatically — do NOT set it.

## Mode A: Manual Creation

**Input**: `/meeting {title}` with optional `folder={subfolder}`

### Workflow

1. **Parse arguments**: Extract the title and optional folder.
2. **Determine folder**: If `folder=` is provided, use `Meetings/{subfolder}/`. Otherwise, ask the user which subfolder to use. List existing subfolders for convenience.
3. **Generate filename**: `{Title} - YYYY-MM-DD.md` using today's date.
4. **Check for duplicates**: If a file with the same name already exists, warn the user and ask how to proceed.
5. **Create the file** with frontmatter. If a matching template exists in `Templates/`, ask the user if they want to apply it as the note body.
6. **Confirm** by printing the created file path.

### Subfolder Shorthand

Accept common abbreviations when provided inline:

| Shorthand | Resolves to |
|-----------|------------|
| `pam` | `PAM` |
| `scrum` | `PAM/Scrum` |
| `1on1`, `1:1` | `One-on-ones` |
| `eng` | `Eng` |
| `qa` | `QA` |
| `tb`, `tbs` | `TBs` |
| `hire`, `hiring` | `HiRing` |
| `onboard` | `Onboarding` |
| `pe` | `PE Leadership` |

Case-insensitive matching. If no shorthand matches and the folder doesn't exist, ask before creating it.

## Mode B: Google Calendar Selection

> **Requires**: Google Calendar MCP server. See [SETUP.md](SETUP.md) for installation.

**Input**: `/meeting` (no arguments)

### Workflow

1. **Fetch today's events** from Google Calendar using the MCP tool.
2. **Present a numbered list** of today's meetings (title, time, attendees).
3. **User picks one** (or types a number).
4. **Derive the title** from the calendar event name.
5. **Infer the subfolder** from attendees or event title:
   - If all attendees are from one team, suggest that team's folder.
   - If it's a 1:1 (2 attendees), suggest `One-on-ones/` or `TBs/`.
   - Otherwise, ask the user.
6. **Create the file** following the same steps as Mode A (steps 3-6).
7. **Pre-fill Participants** from calendar attendees. See [people-resolver](../_shared/people-resolver.md) for name matching rules. Flag any unmatched attendees.

## Mode C: Wrap Up (`/meeting wrap`)

**Input**: `/meeting wrap <path>` — path to an existing meeting note (e.g. `Meetings/PAM/Ben x Zak Sync - 2026-02-25.md`)

If `<path>` is omitted, list today's meeting files under `Meetings/` and let the user pick one.

### Workflow

This is a **sequenced workflow** — sub-skills skip their individual commit steps.

1. **`/cache-notes <path>`** — If `Notes:` frontmatter is empty, prompt the user to paste external resource URLs first. Then fetch and cache AI transcripts.
2. **`/fill-participants <path>`** — Resolve and fill the `Participants:` frontmatter if missing. If already filled, skip silently.
3. **`/followup-todos <path>`** — Extract action items and propose todos from the now-cached content and manual notes.
4. **Commit** — See [/commit](../commit/SKILL.md). Stage all files modified across the three sub-skills. Commit message: `update: /meeting wrap <path>`.

Between each sub-skill, re-read the file to pick up changes from the previous step.

## Mode D: Wrap Pending (`/meeting wrap pending`)

**Input**: `/meeting wrap pending [<dates>]`

Finds all meetings under `Meetings/` that haven't been fully wrapped and runs the wrap sequence (Mode C) on each.

### Pending Detection & Selection

Delegate to [/note-status pending](../note-status/SKILL.md#pending-mode). This handles discovery, frontmatter checks, filtering, presentation, and user selection in one step.

### Date Filtering

See [date-filter](../_shared/date-filter.md) for the full syntax and date parsing rules.

When `<dates>` is provided, pass it through to `/note-status pending`. Default (omitted): all pending meetings (`/note-status pending`).

### Workflow

1. **Run `/note-status pending [<dates>]`**. This discovers meeting files, filters to notes with any missing step, presents the status table, and prompts the user to select which meetings to wrap. Returns the selected file paths.
2. **For each selected meeting**, run the Mode C wrap sequence (`/cache-notes` → `/fill-participants` → `/followup-todos`). Pause between meetings for user input (URLs, todo confirmation, etc.).
3. **Commit once** at the end — stage all files modified across all wrapped meetings. Commit message: `update: /meeting wrap pending — N meetings`.

### Batch Behavior

- Process meetings **oldest first** (by date from filename).
- Between each meeting, print a separator with the current file and progress (e.g. `[2/5] Wrapping: Meetings/PAM/...`).
- If a meeting fails mid-wrap (e.g. Google Docs API error), report the error, skip it, and continue with the next.

## Offer to Commit

See [/commit](../commit/SKILL.md). Applies to Mode A and Mode B only — Modes C and D handle their own commits at the end of the sequence.

## Important Notes

- Always use the Write tool to create new files — never shell commands.
- Use today's date from the system (do not hardcode).
- The timezone offset is `-06:00` (CST). Adjust if the user specifies otherwise.
- If the user provides a full date in the title (e.g., "Sync 2026-03-01"), use that date instead of today's.
