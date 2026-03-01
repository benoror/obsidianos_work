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

| Source | Example | Matches `@Rob.md` |
|--------|---------|-------------------|
| Filename (without `@` and `.md`) | `Rob` | Yes |
| `FullName` frontmatter property | `Rob Klock` | Yes |
| First name (from FullName) | `Rob` | Yes |
| First name (from filename) | `Rob` | Yes |
| Common nicknames | — | Only if explicitly listed in person file |

Also match names preceded by `@` that aren't already wikilinks (e.g. `@Rob` but not `[[@Rob]]`).

## Matching Rules

1. **Full name match** (e.g. "Rob Klock" → `[[@Rob]]`) — high confidence.
2. **Filename match** (e.g. "Rob" → `[[@Rob]]`) — high confidence if unambiguous.
3. **First name only** (e.g. "Robert" for `@Rob`) — low confidence, requires confirmation.
4. **Gemini anonymization** (e.g. "someone in [location]") — cross-reference with meeting Participants and Tracker.md assignees to resolve.

### Word Boundary Matching

When scanning text for name mentions:
- Use word boundary matching — "Rob" should not match inside "Robert" or "Problem".
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
4. **Filename** — `X x Y` patterns (e.g. "Chris x Ben 2026-02-10.md").
5. **Folder conventions** — e.g. `Meetings/PAM/Scrum/` → `[[+PAM]]`.
6. **Similar meetings** — recurring meeting with same name, different date.
7. **Tracker.md** — `[[@Name]]` wikilinks associated with Jira tickets mentioned in context.

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
