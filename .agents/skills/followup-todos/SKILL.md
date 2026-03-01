---
name: followup-todos
description: "Extract action items as Obsidian Tasks checkboxes (with confirmation). Args: <path>. No args = pick from recent meetings."
---

# Follow-up Todos

## Usage

- `/followup-todos <path>` — Extract and propose todos from a specific meeting note.
- `/followup-todos` (no args) — Run [/note-status pending --step=todos](../note-status/SKILL.md#pending-mode) to show meetings missing todo extraction. The user picks one (or more) to process.

## Prerequisites

The meeting file should ideally have cached AI transcripts (from `/cache-notes`). If not cached, suggest running `/cache-notes <path>` first. However, the skill also works on notes with only manual content.

## Obsidian Tasks Format

See [obsidian-tasks](../_shared/obsidian-tasks.md) for the full spec: checkbox states, component order, priorities, date inference, nesting, and assignee rules.

## Workflow

### Step 1: Read the meeting note and gather context

See [vault-context](../_shared/vault-context.md) for vault discovery conventions.

Read the entire file. Also read `Tracker.md` to cross-reference Jira tickets and current task status — this helps:
- **Set priority**: A ticket already marked `🔺` in the Tracker should keep that priority.
- **Avoid duplicates**: If a todo already exists in the Tracker for the same Jira ticket, flag it in the proposal table (Step 3) rather than creating a duplicate.
- **Add context**: If the meeting references a Jira ticket ID (e.g. `PAMENG-1456`), pull its current status and assignee from the Tracker.

Extract action items from **all** content sources, skipping only existing `- [ ]` / `- [x]` todo lines:

1. **Manual notes** (between frontmatter `---` and `## AI Transcripts`): The user may have jotted down action items, commitments, or follow-ups during the meeting as free text (e.g. "- Talk to Chris about X", "Need to review Y"). These are first-class sources. Skip lines that are already checkboxes (`- [*]` — any single character between brackets).
2. **`[!gemini_todos]` callout**: Gemini's "Suggested Next Steps" — explicit action items.
3. **`[!gemini_notes]` callout**: Summary & Details — scan for implicit commitments ("will do X", "agreed to Y", "plans to Z").
4. **Other provider callouts** (`[!otter_todos]`, etc.): Same treatment as Gemini.

Also extract:
- Existing todos matching `- [*]` pattern (any checkbox state) to avoid duplicates
- `Participants:` from frontmatter (to resolve assignees)
- Meeting date (from filename or `created:` frontmatter)

### Step 2: Classify each action item

For each candidate action item (from manual notes, transcript todos, or implicit commitments in details), determine:

1. **Owner**: Who is responsible? See [people-resolver](../_shared/people-resolver.md) for name matching and assignee rules.

2. **Relevance**: Score as `high`, `medium`, or `skip`:
   - **High**: Action is for the user, has a clear deliverable, or is time-sensitive.
   - **Medium**: Action is for someone else but the user should track it, or it's vague but potentially important.
   - **Skip**: Purely informational, already completed (based on date vs today), or not actionable.

3. **Priority**: Based on urgency and impact (see priorities in [obsidian-tasks](../_shared/obsidian-tasks.md)).

4. **Dates**: Infer from meeting context using the date inference rules in [obsidian-tasks](../_shared/obsidian-tasks.md). Assign `📅` (due), `🛫` (start), or `⏳` (scheduled) as appropriate. Omit if no date is mentioned or inferable.

### Step 3: Present proposals to the user — MANDATORY CONFIRMATION

**⚠️ STOP HERE AND WAIT FOR USER CONFIRMATION. Never skip this step, even during `/meeting wrap` sequences. Do NOT write todos to the file until the user explicitly approves.**

Display a numbered table:

```
| # | Add? | Todo | Owner | Priority | Due 📅 | Start 🛫 | Scheduled ⏳ |
|---|------|------|-------|----------|--------|----------|--------------|
| 1 | ✅   | Talk with Chris about temp environments | Me | 🔼 | — | — | — |
| 2 | ✅   | Offload data lake work to Rob | Me | ⏫ | — | — | — |
| 3 | ⬜   | Confirm travel plans for Friday | @Zak | — | 2026-02-28 | — | — |
| 4 | ⬜   | Verify Vtor's prod hash deployed | Me | 🔼 | 2026-02-24 | — | — |
```

- Default `✅` for high-relevance items owned by the user.
- Default `⬜` for others' items or skippable ones.
- Let the user toggle by saying numbers (e.g. "1,3,4" or "all" or "none except 2").

### Step 4: Insert confirmed todos

**Only proceed after the user has explicitly confirmed which todos to include (Step 3).**

Insert the confirmed todos into the note body. Placement depends on the note's template:

#### Daily Standup notes (`Meetings/*/Scrum/YYYY-MM-DD.md`)

These follow the [Daily Standup template](../../../Templates/Daily%20Standup.md):

```
Yesterday
- ...
Today
- ...          ← INSERT TODOS HERE (append after existing Today items)
Blockers
- ...
---
Pending/Carry-over Backlog
- ...
```

Insert todos at the **end of the "Today" section**, just before the `Blockers` line. Use `StrReplace` targeting `Blockers` as the anchor.

#### Other meeting notes

Insert after any existing user content but before `## 🤖 AI Notes` (or `## AI Transcripts`). If neither heading exists, append after the frontmatter closing `---`. Use `StrReplace` targeting the heading as the anchor.

#### General rules

- Group by owner if multiple people are involved.
- Preserve existing content in the section — always append, never overwrite.

### Step 5: Mark as processed

After inserting, add a `TodosExtracted: YYYY-MM-DDTHH:MM:SS-06:00` frontmatter property to prevent re-processing. This is required — `/meeting wrap pending` relies on it to detect unprocessed meetings.

### Step 6: Offer to commit

See [/commit](../commit/SKILL.md). Skip when called as part of a sequence (e.g. `/meeting wrap`).

## Important Notes

- Always read the file before editing — frontmatter may have changed since last read.
- Do NOT duplicate todos that already exist in the note body (compare by description similarity).
- When in doubt about relevance, include it as `⬜` and let the user decide.
- If the meeting is old (>2 weeks), flag items that may already be completed and suggest skipping them.
