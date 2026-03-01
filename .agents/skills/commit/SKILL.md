---
name: commit
description: "Stage and commit with flexible intent parsing. Accepts file/folder scope, free-text description, amend, or any combination."
license: MIT
---

# Commit

## Usage

| Command | What it does |
| --- | --- |
| `/commit` | Commit staged files; if none staged, infer related changes |
| `/commit <file>` | Scope to a specific file's changes |
| `/commit <folder>/` | Scope to a folder's changes |
| `/commit <description>` | Infer scope from free-text intent |
| `/commit <scope> <description>` | Scope + explicit intent |
| `/commit amend` | Amend the last commit (re-use message) |
| `/commit amend <scope/description>` | Amend with additional scope or new message |
| *(sequence mode)* | Deferred — sub-skills skip, caller commits once at the end |

## Argument Parsing

Parse the raw argument string into **scope**, **intent**, and **flags**:

1. **Amend flag**: If the first word is `amend`, set amend mode and strip it. The remainder is parsed normally.
2. **Scope** (file or folder): Any token that matches a real path in the repo (file or directory) — whether provided via `@`-reference or plain text. Multiple scopes are allowed.
3. **Intent** (free-text description): Whatever remains after extracting scopes. Used to guide the commit message.
4. **Nothing**: No arguments at all — default mode.

Examples:

| Input | Scope | Intent | Amend |
| --- | --- | --- | --- |
| *(empty)* | — | — | no |
| `Meetings/PAM/` | `Meetings/PAM/` | — | no |
| `.gitignore` | `.gitignore` | — | no |
| `my awesome refactor` | — | `my awesome refactor` | no |
| `Meetings/ wrap up notes` | `Meetings/` | `wrap up notes` | no |
| `amend` | — | — | yes |
| `amend .obsidian/` | `.obsidian/` | — | yes |
| `amend fixed typo` | — | `fixed typo` | yes |

## Workflow

### 1. Gather state

Run in parallel:

- `git diff --staged --stat` — staged changes
- `git diff --stat` — unstaged changes
- `git status --short` — untracked files
- `git log --oneline -5` — recent commits (for style and amend safety)

### 2. Determine file set

Resolve which files will be committed, based on parsed arguments:

| Scenario | File set |
| --- | --- |
| **Scope provided** | Only changed/untracked files under the given path(s). Ignore everything else. |
| **Intent provided, no scope** | Analyze all changed files; select only those whose diffs relate to the described intent. Present the selection for confirmation. |
| **No args + staged files exist** | Use exactly what's staged. Do NOT add unstaged files — the user intentionally staged those. |
| **No args + nothing staged** | Analyze all changed/untracked files. Group related changes and propose a sensible set. Ask for confirmation. |

If nothing matches (no changes in scope, or no related files for intent), tell the user and stop.

### 3. Stage files

- If the file set is already fully staged, skip.
- If unrelated files are staged, unstage them first (`git restore --staged <path>`).
- Stage the resolved file set with explicit paths — never broad patterns.

### 4. Craft the commit message

Analyze the staged diff (`git diff --staged`) and write:

- **Title**: ≤72 chars, conventional format — `type: summary`.
  - Common types: `add` (new files), `update` (modify existing), `fix` (corrections), `chore` (config/tooling), `feat` (new capability), `refactor`, `docs`, `rename`.
- **Body** (optional): 1–3 lines explaining "why" if not obvious. Omit for trivial changes.
- If the user provided **intent**, use it to guide the message but still ground it in the actual diff.

### 5. Present and confirm

Show:
- The list of files that will be committed (or amended).
- The proposed commit message.

Wait for user confirmation before proceeding.

### 6. Commit

- **Normal mode**: `git commit` with the confirmed message.
- **Amend mode**: `git commit --amend` (see safety rules below). If the user provided new intent, replace the message; otherwise keep the existing message (`--no-edit`).

Do **not** push.

## Amend Safety

Before amending, verify ALL of these conditions:

1. **HEAD was created by you** in this conversation — check `git log -1`.
2. **HEAD has not been pushed** — `git status` should show "Your branch is ahead" or the commit should not exist on the remote.
3. The user explicitly said `amend`.

If any condition fails, **refuse** and explain why. Suggest creating a new commit instead.

## Sequence Mode

When called as part of a **sequenced workflow** (e.g. `/meeting wrap`), the caller owns the commit. Individual sub-skills **skip** their commit step.

How to detect: the calling workflow explicitly states it is running sub-skills in sequence. Do not offer to commit — just proceed. The sequence owner commits once at the end with a combined message.

### Sub-skill commit format

When committing on behalf of a sequence:

- **Message**: `update: /{workflow-name} {argument}` (e.g. `update: /meeting wrap Meetings/PAM/Some Meeting.md`).
- **Stage only** files modified by the current skill invocation (or full sequence). Use explicit paths.
- Present and confirm before committing.

## Important Notes

- This workspace may not be a git repo. If `git status` fails, skip entirely without error.
- Always use explicit file paths for staging — never broad patterns.
- If no files were actually modified, skip the commit offer.
- Never commit files that likely contain secrets (`.env`, credentials, tokens).
- When the scope is a folder, include all changed files recursively under it.
