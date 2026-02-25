---
name: meeting
description: Creates a new Obsidian meeting note in the vault. Supports manual creation with a title or selecting from today's Google Calendar events. Use when the user says /meeting or asks to create a meeting note.
---

# Meeting

## Usage

- `/meeting {title}` — Create a meeting note with the given title and today's date.
- `/meeting {title} folder={subfolder}` — Create in a specific subfolder under `Meetings/`.
- `/meeting` (no args) — List today's Google Calendar events and let the user pick one. *(Requires Google Calendar MCP — see Setup below.)*

## Workspace Layout

```
Meetings/           # All meeting notes, organized by subfolder
  PAM/              # e.g. PAM team meetings
  PAM/Scrum/        # Scrum dailies
  TBs/              # Tech briefs / 1:1s
  One-on-ones/      # 1:1 meetings
  Eng/              # Engineering-wide
  QA/               # QA team
  HiRing/           # Interviews
  Onboarding/       # Onboarding sessions
  PE Leadership/    # PE leadership meetings
Templates/          # Obsidian templates (Daily Standup, Sprint Retro, etc.)
Teams/People/       # Person files: @Name.md
Teams/              # Team files: +TeamName.md
```

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
7. **Pre-fill Participants** from calendar attendees by matching against `Teams/People/` files. Use `[[@Name]]` wikilink format. Flag any unmatched attendees.

## Offer to Commit

See [/commit](../commit/SKILL.md).

## Important Notes

- Always use the Write tool to create new files — never shell commands.
- Use today's date from the system (do not hardcode).
- The timezone offset is `-06:00` (CST). Adjust if the user specifies otherwise.
- If the user provides a full date in the title (e.g., "Sync 2026-03-01"), use that date instead of today's.
