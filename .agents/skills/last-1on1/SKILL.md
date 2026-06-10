---
name: last-1on1
description: "Show when you last had a 1:1 with each direct report / peer, sorted by recency. Flags people who haven't had one in N weeks. Powered by the OneOnOnes view on Meetings.base."
license: MIT
compatibility: Requires Obsidian CLI (base:query) with Obsidian running and Meetings.base (OneOnOnes view).
---

# Last 1:1

## Usage

- `/last-1on1` — Show last 1:1 date per person across all of your 1:1s. Default flag threshold: 2 weeks (anything older highlighted).
- `/last-1on1 <weeks>` — Custom flag threshold (e.g. `/last-1on1 3`).
- `/last-1on1 @Name` — Just for one person.

## Why this skill exists

Direct-report 1:1s and peer syncs are easy to skip when calendars get busy. This skill surfaces the gap — "haven't talked to [[@Alex Kim]] in 3 weeks" — so the next scheduling round prioritizes them.

## Workflow

### Step 1: Pull the source data

Query `obsidian base:query path=Meetings.base view=OneOnOnes format=json`. Returns every meeting under `Meetings/One-on-ones/` and `Meetings/Tech Syncs/` with `file.ctime` and `Participants` columns.

### Step 2: Aggregate by person

For each meeting, extract the participant name(s) from `Participants` (skipping `[[@Me]]` and team links like `[[+Engineering]]`). For each participant, track the most recent `file.ctime`.

Edge case: the file ctime is when the note was *created*, which is usually the day of the meeting — but for older imported notes it may be the import date. If a meeting filename has a `YYYY-MM-DD` suffix, prefer that over file.ctime.

### Step 3: Present sorted table

Sort by `last_date ASC` (oldest first — most overdue at the top):

```
| # | Person | Last 1:1 | Days ago | Status |
|---|--------|----------|----------|--------|
| 1 | [[@Jane Doe]] | 2026-02-05 | 117 | 🔴 overdue |
| 2 | [[@John Smith]] | 2026-04-09 | 54 | 🔴 overdue |
| 3 | [[@Alex Kim]] | 2026-05-06 | 27 | 🟡 due soon |
| 4 | [[@Sam Rivera]] | 2026-05-26 | 7 | ✅ recent |
| 5 | [[@Pat Lee]] | 2026-05-27 | 6 | ✅ recent |
```

- 🔴 overdue: `days_ago > threshold * 2` (default >28 days)
- 🟡 due soon: `threshold < days_ago <= threshold * 2`
- ✅ recent: `days_ago <= threshold`

### Step 4: Offer next action

After the table, suggest:
- "Schedule a 1:1 with the top-3 overdue: [[@Jane Doe]], [[@John Smith]], [[@Alex Kim]]?"
- For each, optionally `/meeting <Name> x Me` to create a stub for the upcoming meeting.

This skill is **read-only** — it doesn't write to the vault.

## Important Notes

- Skip `[[+Engineering]]` and other team links in Participants — those aren't 1:1s, they're group meetings that happen to live in Tech Syncs / One-on-ones (rare but exists).
- Skip people whose `@Name.md` has an `End Date` set (they left the team — no need to schedule a 1:1).
- If a person appears in OneOnOnes but has no `Teams/People/@Name.md` file, surface it as a hint (likely a candidate for `/people-stubs`).
- No commit step — read-only skill.
