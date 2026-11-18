---
name: meeting
description: "Create or wrap meeting notes. Args: {title} [folder=X], wrap <path>, wrap pending [today|this week|dates]. No args = pick from Google Calendar."
license: MIT
compatibility: Requires qmd (CLI or MCP), gws CLI for Calendar (read-only) in Mode B, and Obsidian CLI when running wrap modes (sub-skills). See [google-workspace-cli](../_shared/google-workspace-cli.md).
---

# Meeting

## Usage

- `/meeting {title}` — Create a meeting note with the given title and today's date.
- `/meeting {title} folder={subfolder}` — Create in a specific subfolder under `Meetings/`.
- `/meeting` (no args) — List today's Google Calendar events and let the user pick one. *(Requires `gws` + Calendar — see [SETUP.md](SETUP.md) and [google-workspace-cli](../_shared/google-workspace-cli.md).)*
- `/meeting wrap <path>` — Wrap up an existing meeting by running `/mail-transcripts`, `/cache-notes`, `/fill-participants`, and `/followup-todos` in sequence, with a single commit at the end.
- `/meeting wrap pending [<dates>]` — Find meetings missing any wrap step and wrap them in sequence. Optional date filter (see Mode D).

## File Naming

Format: `{Title} - YYYY-MM-DD.md`

Examples:
- `Engineering - Weekly check-in - 2026-02-18.md`
- `Jane x Alex Sync - 2026-02-23.md`
- `Alert System Brainstorm and Requirement Gathering - 2026-02-06.md`

Exception — Scrum dailies in `Meetings/Engineering/Scrum/` use just `YYYY-MM-DD.md`.

## Frontmatter

Every meeting note starts with YAML frontmatter:

```yaml
---
Notes:
created: YYYY-MM-DDTHH:MM:SS±HH:MM
---
```

- `Notes:` is left empty (populated later with a Google Doc link).
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
| `eng` | `Engineering` |
| `scrum` | `Engineering/Scrum` |
| `1on1`, `1:1` | `One-on-ones` |
| `syncs` | `Tech Syncs` |
| `qa` | `QA` |
| `hire`, `hiring` | `Interviews` |
| `onboard` | `Onboarding` |
| `inbox` | `_inbox` |

Case-insensitive matching. If no shorthand matches and the folder doesn't exist, ask before creating it.

## Mode B: Google Calendar Selection

> **Requires**: [Google Workspace CLI](https://github.com/googleworkspace/cli) (`gws`) with Calendar access (read-only). See [SETUP.md](SETUP.md) and [google-workspace-cli](../_shared/google-workspace-cli.md).

**Input**: `/meeting` (no arguments)

### Workflow

1. **Fetch today's events** from Google Calendar by running **`gws`** in the terminal (e.g. `gws calendar +agenda --today --format json`). See [google-workspace-cli](../_shared/google-workspace-cli.md).
2. **Present a numbered list** of today's meetings (title, time, attendees).
3. **User picks one** (or types a number).
4. **Derive the title** from the calendar event name.
5. **Infer the subfolder** from attendees or event title:
   - If all attendees are from one team, suggest that team's folder.
   - If it's a 1:1 (2 attendees), suggest `One-on-ones/` or `Tech Syncs/`.
   - Otherwise, ask the user.
6. **Create the file** following the same steps as Mode A (steps 3-6).
7. **Pre-fill Participants** from calendar attendees. See [people-resolver](../_shared/people-resolver.md) for name matching rules. Flag any unmatched attendees.

## Mode C: Wrap Up (`/meeting wrap`)

**Input**: `/meeting wrap <path>` — path to an existing meeting note (e.g. `Meetings/One-on-ones/Jane x Alex Sync - 2026-02-25.md`)

If `<path>` is omitted, list today's meeting files under `Meetings/` and let the user pick one.

### Workflow

This is a **sequenced workflow** — sub-skills skip their individual commit steps.

1. **`/mail-transcripts`** — Drain the Gemini transcript inbox first so `Notes:` may be populated before caching. Runs vault-wide (not scoped to `<path>`).
2. **`/cache-notes <path>`** — If `Notes:` is still empty after mail-transcripts, prompt the user to paste external resource URLs. Then fetch and cache AI transcripts.
3. **`/fill-participants <path>`** — Resolve and fill the `Participants:` frontmatter if missing. If already filled, skip silently.
4. **`/followup-todos <path>`** — Extract action items and propose **plain bullet** follow-ups (no Tasks checkboxes) from the now-cached content and manual notes.
5. **Commit** — See [/commit](../commit/SKILL.md). Stage all files modified across the sub-skills. Commit message: `update: /meeting wrap <path>`.

Between each sub-skill, re-read the file (or re-check frontmatter via `obsidian property:read`) to pick up changes from the previous step.

## Mode D: Wrap Pending (`/meeting wrap pending`)

**Input**: `/meeting wrap pending [<dates>]`

Finds all meetings under `Meetings/` that haven't been fully wrapped and runs the wrap sequence (Mode C) on each.

### Pending Detection & Selection

After inbox triage (steps 1–1.5 below), delegate to [/note-status pending](../note-status/SKILL.md#pending-mode). That skill handles discovery, frontmatter checks, filtering, presentation, and user selection in one step.

### Date Filtering

See [date-filter](../_shared/date-filter.md) for the full syntax and date parsing rules.

When `<dates>` is provided, pass it through to `/note-status pending`. Default (omitted): all pending meetings (`/note-status pending`).

### Workflow

1. **`/mail-transcripts`** — Drain the Gemini transcript inbox so newly linked or auto-created notes have `Notes:` populated.
2. **`/organize-meetings`** — Triage `Meetings/_inbox/` so auto-created stubs land in the right subfolder before the pending scan. Use `--auto` only when the user confirms high-confidence moves are acceptable.
3. **Run `/note-status pending [<dates>]`** — Discovers meeting files, filters to notes with any missing step, presents the status table, and prompts the user to select which meetings to wrap. Returns the selected file paths.
4. **For each selected meeting**, run the Mode C wrap sequence starting at step 2 (`/cache-notes` → `/fill-participants` → `/followup-todos`). Skip repeating `/mail-transcripts` per file. Pause between meetings for user input (URLs, todo confirmation, etc.).
5. **Commit once** at the end — stage all files modified across all wrapped meetings (including any inbox moves from step 2). Commit message: `update: /meeting wrap pending — N meetings`.

### Batch Behavior

- Process meetings **oldest first** (by date from filename).
- Between each meeting, print a separator with the current file and progress (e.g. `[2/5] Wrapping: Meetings/Engineering/...`).
- If a meeting fails mid-wrap (e.g. Google Docs API error), report the error, skip it, and continue with the next.

## Offer to Commit

See [/commit](../commit/SKILL.md). Applies to Mode A and Mode B only — Modes C and D handle their own commits at the end of the sequence.

## Important Notes

- Always use the Write tool to create new files — never shell commands.
- Use today's date from the system (do not hardcode).
- Use the user's local timezone offset in `created:` (see [USER.md](../../../USER.md) if configured).
- If the user provides a full date in the title (e.g., "Sync 2026-03-01"), use that date instead of today's.
