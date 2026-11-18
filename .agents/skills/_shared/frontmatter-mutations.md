---
name: frontmatter-mutations
description: "Shared convention for adding, updating, or removing YAML frontmatter properties in vault notes. Use Obsidian CLI instead of hand-rolled StrReplace anchors."
---

# Frontmatter Mutations — Shared Convention

This is not a standalone skill. It defines how any skill should add/update/remove a property in a note's YAML frontmatter.

Skills reference this convention with:

```markdown
See [frontmatter-mutations](../_shared/frontmatter-mutations.md) for how to set/update frontmatter properties.
```

## Core Rule

**Use the `obsidian` CLI for frontmatter mutations** — never hand-roll `StrReplace` against frontmatter anchors.

**Auth gate (O1):** Run `.scripts/check-obsidian-cli.sh` before any `obsidian property:*` command. If it fails, **abort the skill** — see [.agents/rules/external-auth.md](../../rules/external-auth.md) § B.

Obsidian CLI:

- Survives Obsidian-side rewrites (sync conflicts, modified-timestamp updates)
- Handles property types (text, list, number, checkbox, date, datetime) automatically
- Preserves property ordering and indentation
- Doesn't break if the closing `---` moves or the file has unusual whitespace

## Commands

| Need | Command |
|------|---------|
| Set / update a single value | `obsidian property:set name=<key> value="<value>" path="<file>"` |
| Set with explicit type | `obsidian property:set name=<key> value="<value>" type=<type> path="<file>"` |
| Set a list property | `obsidian property:set name=<key> value='["a","b","c"]' type=list path="<file>"` |
| Read a property | `obsidian property:read name=<key> path="<file>"` |
| Remove a property | `obsidian property:remove name=<key> path="<file>"` |
| List all properties on a file | `obsidian properties path="<file>"` |

Property types: `text` (default), `list`, `number`, `checkbox`, `date`, `datetime`.

## Typical Patterns

### "Set if missing" — idempotent property add

```bash
# Check, then set only if absent. Obsidian's property:set will overwrite an existing
# value, so guard with property:read if you need true idempotence.
existing=$(obsidian property:read name=NotesCached path="$file" 2>/dev/null)
[ -z "$existing" ] && obsidian property:set name=NotesCached value="$(date +%FT%T)" type=datetime path="$file"
```

### Wikilink-typed values (Participants, Team)

Obsidian renders wikilinks inside text or list properties. Pass the raw string:

```bash
# Single wikilink (text type — quotes survive YAML round-trip)
obsidian property:set name=Participants value='"[[@Jane Doe]]"' path="$file"

# Multiple wikilinks (list type)
obsidian property:set name=Participants value='["[[@Jane Doe]]","[[@John Smith]]"]' type=list path="$file"
```

### Timestamp properties (NotesCached, TodosExtracted)

Always use `type=datetime` and a **local** ISO 8601 timestamp with **no** timezone offset:

```bash
obsidian property:set name=NotesCached value="$(date +%FT%T)" type=datetime path="$file"
```

The CLI validator accepts only `YYYY-MM-DDTHH:mm` or `YYYY-MM-DDTHH:mm:ss`. Do **not** append an offset — `date +%FT%T%z` produces `2026-06-01T10:30:00-0600` and the command fails with:

```text
Error: Invalid datetime format. Use YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss
```

Older notes in the vault still carry offsets (e.g. `2026-05-19T09:00:00-06:00`) because they were written before this validation existed. Obsidian reads those fine — only new writes through the CLI must omit the offset.

### Appending to a list property

There's no `property:append`. Read, modify, set:

```bash
current=$(obsidian property:read name=Notes path="$file" --format=json)
# add URL, re-serialize
obsidian property:set name=Notes value="$updated_json" type=list path="$file"
```

For URL appends in the Gemini archiver script, the existing Python `add_notes_url()` helper is fine — it's a batch operation outside the skill flow.

## What NOT to do

- **Don't** use `Edit`/`StrReplace` to mutate frontmatter from a skill. It's fragile when Obsidian rewrites the file between read and write.
- **Don't** use `sed`/`awk` for frontmatter — same problem.
- **Don't** worry about the `modified:` property. Obsidian maintains it automatically; skill-side writes will be overwritten.
- **Don't** add a property if `obsidian property:read` already returns the same value — wasted write triggers an Obsidian sync churn.

## Permitted exceptions

- **Standalone Python scripts** (`.scripts/*.py`) that run as cron / batch jobs may use inline YAML manipulation if calling `obsidian` from a non-interactive script is awkward. Document the exception in the script header.
- **Initial file creation** with frontmatter is fine via `Write` — the `obsidian` CLI is for *mutating* existing files.

## When this convention applies

Every skill that mutates a property on an existing file: `cache-notes` (NotesCached), `fill-participants` (Participants), `followup-todos` (TodosExtracted), `organize-meetings` (no frontmatter mutations currently, but if added), and any future skill that touches frontmatter.

Reading frontmatter for inspection (e.g. `note-status` checking which properties exist) can continue to use direct file reads — those are not mutations.
