---
name: date-filter
description: "Shared convention for date filtering syntax and multi-format date parsing. Referenced by skills that accept [dates] arguments or parse dates from filenames/content."
license: MIT
---

# Date Filter — Shared Convention

This is not a standalone skill. It defines the canonical date filtering syntax and date parsing rules used across skills.

Skills reference this convention with:

```markdown
See [date-filter](../_shared/date-filter.md) for date filtering syntax.
```

## Date Filtering Syntax

When a skill accepts a `[dates]` argument, it MUST support this syntax:

| Input | Resolves to |
|-------|-------------|
| *(omitted)* | Skill-specific default (document it in the skill) |
| `today` | Today's date |
| `yesterday` | Yesterday's date |
| `this week` | Monday through today (current week) |
| `last week` | Previous Monday through Sunday |
| `YYYY-MM-DD` | Specific date |
| `YYYY-MM-DD..YYYY-MM-DD` | Inclusive date range |

Literals are case-insensitive. All dates resolve to `start_date` and `end_date` (inclusive, `YYYY-MM-DD` format).

## Date Parsing

Dates appear in many formats across filenames, frontmatter, and external document titles. When extracting a date from free text, recognize at least:

| Format | Example | Common source |
|--------|---------|---------------|
| `YYYY-MM-DD` | `2026-02-24` | Note filenames, frontmatter |
| `YYYY/MM/DD` | `2026/02/24` | Gemini doc titles |
| `MM/DD/YYYY` | `02/24/2026` | US-style |
| `DD/MM/YYYY` | `24/02/2026` | Intl-style |
| `Month DD, YYYY` | `February 24, 2026` | Long form |
| `Mon DD, YYYY` | `Feb 24, 2026` | Short form |
| `DD Month YYYY` | `24 February 2026` | Intl long form |
| ISO 8601 | `2026-02-24T09:43:00-06:00` | Frontmatter timestamps |

### Ambiguity

When a date is ambiguous (e.g. `02/03/2026` — Feb 3 or Mar 2?), prefer the interpretation closest to the surrounding context (e.g. the note's date or the current date). If still ambiguous, skip parsing and don't warn.

### Filename Date Extraction

Meeting filenames use varying formats — do NOT assume a specific naming convention:

- `Title - YYYY-MM-DD.md` (most common)
- `YYYY-MM-DD.md` (scrum dailies)
- Free-form names with dates embedded anywhere

Extract the first `YYYY-MM-DD` pattern found in the filename. If none found, fall back to the `created:` frontmatter timestamp.
