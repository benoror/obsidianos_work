---
name: people-resolver
description: "Shared convention for resolving names to [[@Name]] wikilinks using Teams/People/ files. Covers name dictionary, matching rules, and user identity."
license: MIT
---

# People Resolver — Shared Convention

This is not a standalone skill. It defines how to resolve human names to `[[@Name]]` wikilinks by matching against `Teams/People/` files.

Skills reference this convention with:

```markdown
See [people-resolver](../_shared/people-resolver.md) for name resolution.
```

## User Identity

See [USER.md](../../../USER.md) for the vault owner's full name, aliases, and AI anonymization patterns. Do NOT create wikilinks for the user's own name.

## Name Dictionary

Build a lookup from `Teams/People/` at the start of any name resolution task:

| Source | Example | Matches `@Jane Doe.md` |
|--------|---------|------------------------|
| Filename (without `@` and `.md`) | `Jane Doe` | Yes |
| `FullName` frontmatter property | `Jane Doe` | Yes |
| First name (from FullName) | `Jane` | Yes |
| First name (from filename) | `Jane` | Yes |
| `aliases:` frontmatter list (Obsidian's native alias property) | `["Janie", "JD"]` | Yes |

Also match names preceded by `@` that aren't already wikilinks (e.g. `@Jane` but not `[[@Jane Doe]]`).

### Declarative aliases

For nicknames, transcription variants (e.g. Gemini hearing "Janie" for `@Jane Doe`), or alternate spellings (e.g. accented letters), declare them in the person file's frontmatter using Obsidian's native `aliases:` property:

```yaml
---
aliases:
  - Janie
  - JD
Team: "[[+Engineering]]"
FullName: Jane Doe
---
```

Read aliases at dictionary-build time via `obsidian aliases file="@Jane Doe" format=json` — no hardcoded alias map in the resolver, no skill update needed when a new variant shows up.

## Matching Rules

1. **Full name match** (e.g. "Jane Doe" → `[[@Jane Doe]]`) — high confidence.
2. **Filename match** (e.g. "Jane Doe" → `[[@Jane Doe]]`) — high confidence if unambiguous.
3. **First name only** (e.g. "Jane" for `@Jane Doe`) — low confidence, requires confirmation.
4. **Gemini anonymization** (e.g. "someone in [location]") — cross-reference with meeting Participants and (when available) Jira assignees or a live Tracker to resolve.

### Word Boundary Matching

When scanning text for name mentions:
- Use word boundary matching — "Jane" should not match inside "Janet" or "Janeiro".
- Skip matches inside `[[@...]]` wikilinks (already linked).
- Skip matches inside frontmatter `---` fences.
- Skip matches inside URLs or code blocks.

## Wikilink Format

- Person: `[[@Name]]` — matches filename in `Teams/People/@Name.md` (without `.md`).
- Team: `[[+TeamName]]` — matches filename in `Teams/+TeamName.md`.

## Resolution Priority

When multiple sources mention people, resolve in this order:

1. **Google Docs / Gemini notes** — names participants explicitly.
2. **Google Calendar attendees** — email → match against People files.
3. **File content** — existing `[[@Name]]` references in the body.
4. **Filename** — `X x Y` patterns (e.g. "Alex x Me 2026-02-10.md").
5. **Folder conventions** — e.g. `Meetings/Engineering/Scrum/` → `[[+Engineering]]`.
6. **Similar meetings** — recurring meeting with same name, different date.
7. **Jira assignees** (when Atlassian MCP is configured) for ticket keys in context; optionally a **live** Tracker (`Tracker.md` / `Trackers/*.md`) if present — skip archived/stub trackers.

## Creating New People

When a name is encountered that has no match in `Teams/People/`:

1. Flag it for user confirmation.
2. If confirmed as a new person, ask which Team they belong to.
3. Create `Teams/People/@Name.md` with frontmatter:

```yaml
---
FullName: First Last
Team: "[[+TeamName]]"
---
```
