---
name: vault-health
description: "Audit the vault for structural issues: unresolved wikilinks, orphan notes, dead-end notes, and Obsidian sync conflicts. Optional --fix flags create stubs or surface fixable issues."
license: MIT
---

# Vault Health

## Usage

- `/vault-health` — Run all checks, present a triage report.
- `/vault-health unresolved` — Only show unresolved `[[wikilinks]]`.
- `/vault-health orphans` — Only show notes with no incoming links.
- `/vault-health deadends` — Only show notes with no outgoing links.
- `/vault-health sync` — Only check Obsidian sync conflicts.
- `/vault-health --fix-people` — For unresolved `[[@*]]` links, prompt to create `Teams/People/@Name.md` stubs in batch (delegates to `/people-stubs`).

## Why this skill exists

The vault grows over time and accumulates structural debt:
- Dead `[[@Jane Doe]]` links because the person file was never created.
- Notes orphaned in subfolders, never linked from any project/team page.
- Sync conflicts when two devices edit the same file simultaneously.

This skill surfaces all of that in one pass.

## Workflow

### Step 1: Run all checks (or the subset requested)

| Check | Command | What it returns |
|-------|---------|-----------------|
| Unresolved links | `obsidian unresolved format=json` | All `[[link]]` pointers with no target file. |
| Orphans | `obsidian orphans format=json` | Files no other file links to. |
| Deadends | `obsidian deadends format=json` | Files with no outgoing links. |
| Sync conflicts | `obsidian sync:status format=json` | Files with unresolved sync versions. |

Run only the requested subset; full sweep when no argument is given.

### Step 2: Categorize and present

Group findings by type and severity:

```
## Unresolved wikilinks (12)

People-flavored ([[@*]]) — likely missing People files:
| # | Link | Referenced in (count) |
|---|------|----------------------|
| 1 | [[@Jane Doe]] | 6 meetings |
| 2 | [[@John Smith]] | 3 meetings |

Other unresolved:
| # | Link | Referenced in |
|---|------|---------------|
| 3 | [[+SomeNewTeam]] | 1 meeting |

## Orphan notes (4)
| # | Path | Created | Reason it might matter |
|---|------|---------|------------------------|
| 1 | Meetings/Engineering/Old Notes.md | 2026-01-12 | Probably needs to link to a project page |

## Deadend notes (8)
...

## Sync conflicts (0)
✓ All synced.
```

For people-flavored unresolved links, **sort by count descending** — most-referenced unresolved person is most worth creating a file for.

### Step 3: Offer fixes

- For `--fix-people` (or after presenting): prompt the user to create People stubs in batch. Delegate to `/people-stubs` which handles the actual creation.
- For orphans/deadends: don't auto-fix. They might be intentional. Just surface.
- For sync conflicts: don't auto-fix. Sync conflicts need human judgment. Surface and tell the user to resolve via Obsidian's UI or `obsidian sync:history`.

### Step 4: Commit

See [/commit](../commit/SKILL.md). The skill itself doesn't write files (except via `/people-stubs` if invoked). If anything changed, commit message: `chore(vault-health): create N people stubs from unresolved links` (or similar).

## Sync conflict resolution

When `obsidian sync:status` reports conflicts:

1. List them with `obsidian sync:status format=json` (path + version count per file).
2. For each conflicted file, surface in the report with these next-action hints:
   - **View versions**: `obsidian sync:history file="<path>"` — see what each side wrote.
   - **Read a specific version**: `obsidian sync:read file="<path>" version=<N>` — preview without writing.
   - **Restore**: `obsidian sync:restore file="<path>" version=<N>` — pick one side.
   - **Manual merge** (preferred when both sides have meaningful changes): open the file in Obsidian, use the Sync history pane to pick chunks.
3. Never auto-restore — sync conflicts mean both sides have edits the user might want. Surface and let them choose.

Display sync conflicts at the **top** of the report (not last) — they're time-sensitive (the longer they sit, the more divergent the versions get).

## Important Notes

- The skill is **read-only by default** — only `--fix-people` triggers writes (and even then, via `/people-stubs` with confirmation).
- Some orphans are intentional (e.g. `USER.md`, `README.md`). Consider an exclusion list in a future iteration.
- Sync conflict detection assumes Obsidian Sync is configured. If not, this check is a no-op (prints "✓ Sync not configured — skipped").
- Obsidian CLI requires the desktop app to be running. If it's not, the skill should print a helpful error.
