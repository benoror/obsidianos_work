---
name: people-stubs
description: "Batch-create Teams/People/@Name.md stubs from unresolved [[@*]] wikilinks across the vault. Each stub is minimal frontmatter; the user fills team/role/details later."
license: MIT
---

# People Stubs

## Usage

- `/people-stubs` — Scan unresolved `[[@*]]` links, present a creation list, prompt to confirm each.
- `/people-stubs --auto` — Create stubs for every unresolved `[[@*]]` link without per-name confirmation. Useful after a big batch of new interviews.

## Why this skill exists

When meeting notes are wrapped via `/fill-participants`, names get linked as `[[@Jane Doe]]`, `[[@John Smith]]`, etc. If the corresponding `Teams/People/@Name.md` file doesn't exist yet, Obsidian shows a dead-link indicator and the name doesn't appear in `People.base`. This skill creates the missing stubs in one pass.

Stubs are intentionally minimal — they're placeholders. The user (or a future `/onboard-person` skill) fills in the real metadata (Team, Location, FullName, Start Date, etc.).

## Workflow

### Step 1: Discover unresolved [[@*]] links

Run `obsidian unresolved format=json` and filter to entries where the link target starts with `@`. Aggregate by target — one stub per unique target, with a list of files where it's referenced.

### Step 2: Present the creation list

Display a numbered table sorted by reference count descending:

```
| # | Stub to create | Referenced in (count) | Sample file |
|---|----------------|----------------------|-------------|
| 1 | Teams/People/@Jane Doe.md | 6 | Meetings/Interviews/Interview Alex Kim... |
| 2 | Teams/People/@John Smith.md | 3 | Meetings/Engineering/Weekly Team Leads... |
| 3 | Teams/People/@Alex Kim.md | 2 | Meetings/Engineering/Weekly Team Leads... |
```

Ask the user: "all", "1,2", "none", or per-line skips.

### Step 3: Create stubs

For each confirmed stub, write `Teams/People/@<Name>.md` with this minimal frontmatter:

```yaml
---
FullName:
Team:
Location:
created: <ISO 8601 with offset>
---
```

Use `obsidian create path="Teams/People/@<Name>.md" content="<frontmatter>"` so Obsidian indexes it immediately (the next `/vault-health` run won't show the link as unresolved any more).

Leave `FullName`, `Team`, `Location` empty — the stub is a placeholder. The agent can fill in `FullName` if it can infer from the wikilink display text (e.g. `[[@Jane Doe]]` → `FullName: Jane Doe`).

### Step 4: Report

Print a summary:
```
Created 3 stubs:
  Teams/People/@Jane Doe.md
  Teams/People/@John Smith.md
  Teams/People/@Alex Kim.md

Next steps:
- Open each stub and fill in Team / Location / Start Date.
- Or run /onboard-person <name> to pull metadata from external sources.
```

### Step 5: Commit

See [/commit](../commit/SKILL.md). Commit message: `chore(people): add N stubs (Jane Doe, John Smith, ...)`.

## Important Notes

- **Don't create stubs for the user's own aliases** — they're handled by `USER.md` aliases.
- **Don't create stubs for candidate names** (someone interviewed once but never hired). The /vault-health report should let the user skip those manually. If a name has only 1-2 references and they're all from an interviews folder, surface a hint that this might be a candidate.
- **Filename collision**: if `Teams/People/@<Name>.md` exists already (even empty), don't overwrite. Skip and note in the report.
- Stubs make subsequent `/vault-health` runs cleaner — the unresolved-links count drops as stubs are created.
