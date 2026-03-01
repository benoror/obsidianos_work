---
name: commit
description: "Stage and commit with inferred or explicit message. Args: [description], [file/path]. No args = infer from diff."
---

# Commit

## Usage

- `/commit` — Standalone: infer commit message from current diff (see Mode A).
- `/commit <description>` — Standalone with explicit intent: use the description to craft the message (see Mode B).
- *(sub-skill)* — Referenced by other skills as a final step via `See [/commit](../commit/SKILL.md).`

## Sequence Mode

When a skill is called as part of a **sequenced workflow** (e.g. `/meeting wrap`), the caller is responsible for the single commit at the end. Individual skills **skip** their commit step in this case.

How to detect: the calling workflow will explicitly state it is running sub-skills in sequence. When you are executing a sub-skill within a sequence, do not offer to commit — just proceed to the next sub-skill. The sequence owner commits once at the end with a combined message.

## Mode A: Standalone — No Arguments (`/commit`)

Infer what changed from the diff and craft an appropriate commit message.

### Workflow

1. **Check for staged files**: Run `git diff --staged --stat`.
2. **If staged files exist**: Analyze `git diff --staged` to understand the changes. **Only commit what's already staged** — do NOT suggest adding unstaged files. The user intentionally staged those files; respect that.
3. **If no staged files**: Analyze `git diff` (unstaged changes) and `git status --short` (untracked files). Present the full list of changed/untracked files and ask the user which to include, or propose a sensible grouping.
4. **Craft the commit message**: Analyze the diff content and write a title + description:
   - **Title**: Short (≤72 chars), conventional format — `type: summary` (e.g. `update: meeting notes for 02-26`, `fix: broken wikilink in PAM Data Integrity`).
   - **Description** (optional): 1–3 lines explaining the "why" if not obvious from the title. Omit for trivial changes.
   - Common types: `update` (modify existing), `add` (new files), `fix` (corrections), `chore` (config/tooling), `feat` (new capability).
5. **Present and confirm**: Show the files that will be committed and the proposed message. Wait for user confirmation.
6. **Commit**: If files were already staged, just `git commit`. If no files were staged (step 3 path), `git add` the confirmed files first, then commit.

## Mode B: With Arguments (`/commit <description>`)

The user provides intent; craft the message from it.

### Workflow

1. **Parse the description**: The argument describes the intent (e.g. `/commit meeting notes`, `/commit @Meetings`).
2. **Determine scope**: If the argument references a folder (e.g. `@Meetings`), scope to files under that folder. Otherwise, use all modified files.
3. **Analyze the diff**: Run `git diff` (and `git diff --staged` if applicable) scoped to the relevant files.
4. **Craft the commit message**: Use the user's description as the intent, but still analyze the diff to write a precise title + description.
5. **Present and confirm**: Same as Mode A step 5.
6. **Stage and commit**: Same as Mode A step 6.

## Mode C: Sub-skill (referenced by other skills)

### Workflow

1. **Offer to commit**: After all edits are applied, ask the user if they'd like to commit the changes.
2. **Stage only modified files**: Only stage files that were actually modified by the current skill invocation (or the full sequence). Do NOT stage unrelated files that may have changed externally or via Obsidian plugins. Use `git add` with **explicit file paths**.
3. **Commit message**:
   - **Standalone**: `update: /{skill-name} {argument}`
   - **Sequence**: `update: /{workflow-name} {argument}` (e.g. `update: /meeting wrap Meetings/PAM/Some Meeting.md`)
4. **Confirm and commit**: Present the list of files and proposed message. Wait for user confirmation. If the user declines, skip silently.

## Important Notes

- This workspace may not be a git repo. If `git status` fails, skip the commit step entirely without error.
- Always use explicit file paths for staging — never broad patterns.
- If no files were actually modified, skip the commit offer.
- Never commit files that likely contain secrets (`.env`, credentials, tokens).
