---
name: obsidian-tasks
description: "Shared convention for Obsidian Tasks plugin syntax: checkbox states, task components, priorities, date inference, and nesting."
license: MIT
---

# Obsidian Tasks — Shared Convention

This is not a standalone skill. It defines the canonical [Obsidian Tasks](https://publish.obsidian.md/tasks/) plugin syntax used when creating or reading task checkboxes.

Skills reference this convention with:

```markdown
See [obsidian-tasks](../_shared/obsidian-tasks.md) for task format.
```

## Full Task Line

```markdown
- [ ] [[@Assignee]] Description 🔼 🛫 2026-03-01 📅 2026-03-07 🔁 every week
```

## Checkbox States

| State | Syntax | Meaning |
|-------|--------|---------|
| Open | `- [ ]` | Not started |
| Done | `- [x]` | Completed (append `✅ YYYY-MM-DD`) |
| In progress | `- [/]` | Started |
| Cancelled | `- [-]` | Cancelled (append `❌ YYYY-MM-DD`) |

## Task Components (recommended order)

| Element | Emoji | Format | Required |
|---------|-------|--------|----------|
| Checkbox | — | `- [*]` | Yes |
| Assignee | — | `[[@Name]]` wikilink prefix | If not the user |
| Description | — | Free text | Yes |
| Priority | `🔺⏫🔼🔽` | After description | Optional |
| Created date | `➕` | `➕ YYYY-MM-DD` | Optional |
| Start date | `🛫` | `🛫 YYYY-MM-DD` — earliest date to begin work | Optional |
| Scheduled date | `⏳` | `⏳ YYYY-MM-DD` — date planned to work on it | Optional |
| Due date | `📅` | `📅 YYYY-MM-DD` — hard deadline | Optional |
| Done date | `✅` | `✅ YYYY-MM-DD` | When completing |
| Cancelled date | `❌` | `❌ YYYY-MM-DD` | When cancelling |
| Recurrence | `🔁` | `🔁 every <interval>` (e.g. `every week`, `every month on the 1st`) | Optional |

## Priorities

```
🔺 Highest — blocking, deadline this week, critical path
⏫ High    — important but not urgent, next sprint
🔼 Medium  — moderate urgency
🔽 Low     — low urgency
```

## Date Inference

When extracting todos from meeting notes or other content, infer dates from context:

| Phrase | Maps to |
|--------|---------|
| "today", "end of day" | `📅` = meeting date |
| "tomorrow" | `📅` = meeting date + 1 |
| "by Friday", "end of week" | `📅` = that Friday |
| "Monday", "next week" | `📅` = next Monday |
| "next sprint" | `🛫` = next sprint start (if known) |
| "start working on X" | `🛫` = inferred start date |
| "schedule for \<date\>" | `📅` = that date |

When in doubt, include the date in the confirmation table and let the user decide.

## Nested Sub-tasks

Use tab indentation:

```markdown
- [ ] Main task 🔼
	- [ ] Sub-task 1
	- [ ] Sub-task 2
```

## Assignee Rules

- If the owner is the user (see [USER.md](../../../USER.md)), **omit** the assignee prefix.
- If the owner matches a Gemini anonymization pattern (see USER.md), try to resolve from context or Participants. See [people-resolver](people-resolver.md).
- If the owner is someone else, prefix with `[[@Name]]`.
