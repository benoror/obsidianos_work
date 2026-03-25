---
name: followup-todos
description: "Extract action items as plain markdown bullets (with confirmation). Args: <path>. No args = run [/note-status pending --step=todos](../note-status/SKILL.md#pending-mode)."
license: MIT
---

# Follow-up Todos

## Usage

- `/followup-todos <path>` — Extract and propose follow-ups from a specific meeting note.
- `/followup-todos` (no args) — Run [/note-status pending --step=todos](../note-status/SKILL.md#pending-mode) to show meetings missing follow-up extraction. The user picks one (or more) to process.

## Output format (mandatory)

- **Never** insert Obsidian **Tasks** / checkbox lines: no `- [ ]`, `- [x]`, `- [-]`, or any `- [?]` pattern.
- **Never** append **Tasks-plugin** inline metadata on inserted lines: no `📅`, `🛫`, `⏳`, or other parsed task tokens. (Optional **priority emoji** at the very end as plain text — e.g. `🔼` — is fine if it reads naturally in prose.)
- **Always** insert **plain list items**: `- Description…` Wikilinks (`[[@Name]]`, `[[+Team]]`) and **bold** are allowed.

## Prerequisites

The meeting file should ideally have cached AI transcripts (from `/cache-notes`). If not cached, suggest running `/cache-notes <path>` first. However, the skill also works on notes with only manual content.

## Optional context

For **classification** (owner, urgency, dates in the proposal step), you may still use [people-resolver](../_shared/people-resolver.md) and [obsidian-tasks](../_shared/obsidian-tasks.md) as *reference* — but **do not** copy Tasks checkbox or date-token syntax into the note.

## Workflow

### Step 1: Read the meeting note and gather context

See [vault-context](../_shared/vault-context.md) for vault discovery conventions.

Read the entire file. Also read `Tracker.md` to cross-reference Jira tickets and current task status — this helps:
- **Set priority**: A ticket already marked `🔺` in the Tracker should keep that priority (as trailing emoji in the bullet text if you include one).
- **Avoid duplicates**: If a follow-up already exists in the Tracker for the same Jira ticket, flag it in the proposal table (Step 3) rather than creating a duplicate line in the note.
- **Add context**: If the meeting references a Jira ticket ID (e.g. `PAMENG-1456`), pull its current status and assignee from the Tracker.

Extract action items from **all** content sources, skipping lines that are **already captured** as follow-ups (compare meaning, not only exact text):

1. **Manual notes** (between frontmatter `---` and `## 🤖 AI Notes` / `## AI Transcripts`): Free-text action items (e.g. "- Talk to Chris about X"). Skip lines that are **checkbox** tasks (`- [*]` — any single character between brackets) when **deduplicating**, but note the vault may still contain legacy `- [ ]` lines from older runs.
2. **`[!gemini_todos]` callout**: Gemini's "Suggested Next Steps" — explicit action items.
3. **`[!gemini_notes]` callout**: Summary & Details — scan for implicit commitments ("will do X", "agreed to Y", "plans to Z").
4. **Other provider callouts** (`[!otter_todos]`, etc.): Same treatment as Gemini.

Also extract:
- Existing **plain** bullets and **checkbox** lines in the follow-up section to avoid duplicates
- `Participants:` from frontmatter (to resolve assignees)
- Meeting date (from filename or `created:` frontmatter)

### Step 2: Classify each action item

For each candidate action item (from manual notes, transcript todos, or implicit commitments in details), determine:

1. **Owner**: Who is responsible? See [people-resolver](../_shared/people-resolver.md) for name matching and assignee rules.

2. **Relevance**: Score as `high`, `medium`, or `skip`:
   - **High**: Action is for the user, has a clear deliverable, or is time-sensitive.
   - **Medium**: Action is for someone else but the user should track it, or it's vague but potentially important.
   - **Skip**: Purely informational, already completed (based on date vs today), or not actionable.

3. **Priority** (for the proposal table only): Based on urgency and impact (see priorities in [obsidian-tasks](../_shared/obsidian-tasks.md)). When inserting bullets, you may end the line with a single priority emoji (`🔺` `⏫` `🔼` `🔽`) as **plain text** — never as Tasks metadata.

4. **Dates**: Note due/start in the **proposal table** when helpful; **do not** put `📅` / `🛫` / `⏳` on inserted lines. If a date matters, write it in words in the bullet (e.g. "by **2026-03-26**").

### Step 3: Present proposals to the user — MANDATORY CONFIRMATION

**⚠️ STOP HERE AND WAIT FOR USER CONFIRMATION. Never skip this step, even during `/meeting wrap` sequences. Do NOT write follow-ups to the file until the user explicitly approves.**

Display a numbered table:

```
| # | Add? | Follow-up | Owner | Priority |
|---|------|-----------|-------|----------|
| 1 | ✅   | Talk with Chris about temp environments | Me | 🔼 |
| 2 | ✅   | Offload data lake work to Rob | Me | ⏫ |
| 3 | ⬜   | Confirm travel plans for Friday | @Zak | — |
| 4 | ⬜   | Verify Vitor's prod hash deployed | Me | 🔼 |
```

- Default `✅` for high-relevance items owned by the user.
- Default `⬜` for others' items or skippable ones.
- Let the user toggle by saying numbers (e.g. "1,3,4" or "all" or "none except 2").

### Step 4: Insert confirmed follow-ups

**Only proceed after the user has explicitly confirmed which items to include (Step 3).**

Insert each confirmed item as **one line**:

```markdown
- Clear, self-contained description (optional **bold**, `[[@Name]]`, optional trailing 🔼)
```

**Do not** use `- [ ]`. Placement depends on the note's template:

#### Daily Standup notes (`Meetings/*/Scrum/YYYY-MM-DD.md`)

These follow the [Daily Standup template](../../../Templates/Daily%20Standup.md):

```
Yesterday
- ...
Today
- ...          ← INSERT FOLLOW-UPS HERE (append after existing Today items)
Blockers
- ...
---
Pending/Carry-over Backlog
- ...
```

Insert at the **end of the "Today" section**, just before the `Blockers` line. Use `StrReplace` targeting `Blockers` as the anchor.

#### Other meeting notes

Prefer a dedicated section heading if missing, e.g. `## Follow-ups`, placed after the title / any manual notes and **before** `## 🤖 AI Notes` (or `## AI Transcripts`). If a `## Follow-ups` (or equivalent) section already exists, **append** there. If neither heading exists, append after the frontmatter closing `---` and add `## Follow-ups` first.

#### General rules

- Group by owner if multiple people are involved (optional sub-bullets under a short `**[[@Name]]**` line).
- Preserve existing content — always append, never overwrite.

### Step 5: Mark as processed

After inserting, add a `TodosExtracted: YYYY-MM-DDTHH:MM:SS-06:00` frontmatter property to prevent re-processing. This is required — `/meeting wrap pending` relies on it to detect unprocessed meetings.

### Step 6: Offer to commit

See [/commit](../commit/SKILL.md). Skip when called as part of a sequence (e.g. `/meeting wrap`).

## Important Notes

- Always read the file before editing — frontmatter may have changed since your last read.
- Do NOT duplicate follow-ups that already exist in the note body (compare by description similarity).
- When in doubt about relevance, include it as `⬜` in Step 3 and let the user decide.
- If the meeting is old (>2 weeks), flag items that may already be completed and suggest skipping them.
