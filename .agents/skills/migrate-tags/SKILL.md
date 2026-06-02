---
name: migrate-tags
description: "Migrate body-level #hashtags to frontmatter `tags:` lists so Bases can filter on them. Idempotent — leaves files that already have frontmatter tags alone."
license: MIT
---

# Migrate Tags

## Usage

- `/migrate-tags` — Scan vault, present a migration plan, prompt to confirm.
- `/migrate-tags <path>` — Migrate a single file.
- `/migrate-tags <folder>` — Migrate all `.md` files under a folder.
- `/migrate-tags --dry-run` — Show what would change without writing.

## Why this skill exists

Obsidian supports two tag styles:
- Body tags: `#frontend` written inline in note text.
- Frontmatter tags: a YAML `tags:` list at the top of the file.

Bases can filter on the frontmatter style (`file.hasTag("frontend")`) but **not** the body style reliably. Migrating one to the other makes tags queryable in Bases views — e.g. a "People with `#mobile` tag" view becomes trivial once everyone's @Name.md has `tags: [mobile]`.

This skill is a one-shot migration utility plus an ongoing cleanup tool for new notes.

## Workflow

### Step 1: Discover candidates

Use `obsidian tags format=json` to enumerate all tags + their usage counts and source files. Identify files where:
- A body `#tag` exists, AND
- The same tag is NOT already present in frontmatter `tags:`.

These are the migration candidates.

### Step 2: Present the plan

Show a numbered table grouped by file:

```
| # | File | Body tags to migrate | Existing frontmatter tags |
|---|------|----------------------|---------------------------|
| 1 | Teams/People/@Jane Doe.md | #team-engineering, #backend | (none) |
| 2 | Teams/People/@John Smith.md | #team-engineering, #remote | (none) |
| 3 | Misc/Reading.md | #to-read, #book | (none) |
```

Ask the user: "all", "1,2", "none", or per-file picks.

### Step 3: Apply migration

For each confirmed file:

1. Read the file body, collect all `#tag` patterns (respecting word boundaries — `#tag` not `https://foo.com/path#section`).
2. Use `obsidian property:set name=tags value='["a","b","c"]' type=list path="<file>"` to write the frontmatter list. If `tags:` already exists, merge (don't overwrite). See [frontmatter-mutations](../_shared/frontmatter-mutations.md).
3. Optionally remove the body `#tag` patterns (default: leave them — Obsidian indexes both, body tags don't hurt). Add a `--strip-body` flag for users who want clean bodies.

### Step 4: Verify

Run `obsidian property:read name=tags path="<file>"` on each migrated file to confirm the write. Spot-check that no tags were lost.

### Step 5: Commit

See [/commit](../commit/SKILL.md). Commit message: `chore: migrate body #tags to frontmatter tags: list (N files)`.

## Important Notes

- **Idempotent**: re-running on already-migrated files is a no-op.
- **Don't strip body tags by default** — users may rely on visible tags in the body for in-note navigation. Opt-in via `--strip-body`.
- **Tag normalization**: leave tag names as-is. Don't auto-convert `#team-engineering` → `team-engineering` (the leading `#` is stripped automatically; nothing else).
- **Nested tags** (`#team/engineering`) are preserved.
- **Tags inside code blocks** are skipped — they're literal, not Obsidian tags.
- After running on People files, `People.base` per-team views can use `file.hasTag("team-X")` as an alternative to the `file.hasLink(file("Teams/+X.md"))` filter (which works but is more verbose).
