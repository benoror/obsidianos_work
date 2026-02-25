---
name: commit
description: Offers to commit changes after a skill modifies files. Stages only the affected files, uses a conventional commit message, and waits for user confirmation. Referenced by other skills as a final step.
---

# Commit

## Usage

This skill is invoked as the **final step** of any skill that modifies files. It is not meant to be called standalone — other skills reference it via:

```
See [/commit](../commit/SKILL.md).
```

## Workflow

### Step 1: Offer to commit

After all edits are applied, ask the user if they'd like to commit the changes.

### Step 2: Stage only modified files

- Only stage files that were actually modified by the current skill invocation.
- Do NOT stage unrelated files that may have changed via iCloud sync or Obsidian plugins.
- Use `git add` with **explicit file paths** — never `git add .` or `git add -A`.

### Step 3: Commit message

Default format: `update: /{skill-name} {argument}`

Where `{skill-name}` is the calling skill (e.g. `fill-participants`, `cache-notes`) and `{argument}` is `all` or the specific path/target used.

### Step 4: Confirm and commit

Present the list of files that will be staged and the proposed commit message. Wait for user confirmation before committing. If the user declines, skip silently.

Example flow:

```
I've updated 5 meeting files. Want me to commit these changes?

Files to stage:
  - Meetings/PAM/Ben x Zak Sync - 2026-02-23.md
  - Meetings/PAM/Scrum/2026-02-25.md (+ 3 more)

Commit message: "update: /followup-todos week"

[Yes / No]
```

## Important Notes

- This workspace may not be a git repo. If `git status` fails, skip the commit step entirely without error.
- Always use explicit file paths for staging — never broad patterns.
- If no files were actually modified, skip the commit offer.
