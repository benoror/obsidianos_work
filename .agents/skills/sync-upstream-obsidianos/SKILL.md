---
name: sync-upstream-obsidianos
description: "Pull structural updates from upstream ObsidianOS into the local vault."
license: MIT
---

# Sync Upstream ObsidianOS

Shortcut to run [`.scripts/sync-upstream.sh`](../../../.scripts/sync-upstream.sh).

## Usage

| Command | What it does |
| --- | --- |
| `/sync-upstream-obsidianos` | Preview and merge upstream updates |
| `/sync-upstream-obsidianos preview` | Preview only — show what's new without merging |

## Workflow

### 1. Check prerequisites

- Verify `upstream` remote exists: `git remote get-url upstream`. If missing, tell the user to add it:
  ```
  git remote add upstream <url-to-upstream-repo>
  ```
- Verify working tree is clean (`git status --short`). If dirty, ask the user to commit or stash first.

### 2. Preview

Run `.scripts/sync-upstream.sh --preview` and show the output (new commits and changed files).

If there are no new commits, report "already up to date" and stop.

If the user only asked for `preview`, stop here.

### 3. Confirm and merge

Present the preview results and ask the user to confirm before merging.

On confirmation, run the full sync:

```
echo y | ./.scripts/sync-upstream.sh
```

### 4. Report results

Show the merge outcome:
- Which files were updated.
- Whether any files were excluded via `.sync-exclude`.
- The final commit (`git log -1 --oneline`).

If the merge had conflicts, relay the conflict list and instruct the user to resolve manually.

## Important Notes

- The script protects personal files (Meetings, Teams, Templates, etc.) via `.gitattributes` merge=ours rules.
- Files matching patterns in `.sync-exclude` are auto-removed from the merge (e.g. upstream example files).
- This skill never pushes — the user decides when to push.
- If the `upstream` remote doesn't exist, do not create it automatically — prompt the user for the URL.
