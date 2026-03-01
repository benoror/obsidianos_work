# Obsidian Vault — Skill Conventions

## Shared Conventions

Skills that share common patterns MUST reference the shared convention instead of duplicating logic:

| Convention | Reference | When to use |
|---|---|---|
| Commit | `See [/commit](../skills/commit/SKILL.md).` | Every skill that modifies files — final step |
| Vault Context | `See [vault-context](../skills/_shared/vault-context.md).` | Any skill that searches or reads vault content (meetings, tracker, notes) |
| Date Filter | `See [date-filter](../skills/_shared/date-filter.md).` | Any skill that accepts `[dates]` arguments or parses dates from filenames/content |
| Obsidian Tasks | `See [obsidian-tasks](../skills/_shared/obsidian-tasks.md).` | Any skill that creates or reads task checkboxes |
| People Resolver | `See [people-resolver](../skills/_shared/people-resolver.md).` | Any skill that resolves names to `[[@Name]]` wikilinks |

Never duplicate these workflows — always delegate.

## Structure

Skills live in `.agents/skills/{skill-name}/SKILL.md`. Follow the existing pattern:

1. YAML frontmatter with `name`, `description`, `license: MIT`, and optionally `compatibility` (MCP server dependencies)
2. `## Usage` — slash-command syntax
3. `## Workflow` — numbered steps
4. Commit step (see above) — before Important Notes
5. `## Important Notes` — caveats and edge cases

## Project Context

- This is an **Obsidian vault**
- User identity, timezone, and aliases: see [USER.md](../../USER.md)
- People files: `Teams/People/@Name.md`
- Team files: `Teams/+TeamName.md`
- Meeting notes: `Meetings/{subfolder}/`
- Frontmatter `modified:` is managed by Obsidian — never set it manually

## Obsidian Tasks Priorities

Quick reference (full spec in [obsidian-tasks](../skills/_shared/obsidian-tasks.md)):

`🔺` Highest · `⏫` High · `🔼` Medium · `🔽` Low

## Existing Skills

Reference these for patterns and to avoid duplication:

| Skill | Purpose |
|---|---|
| `/meeting` | Create meeting notes (manual / Google Calendar), wrap up with `/meeting wrap`, or batch-wrap pending with `/meeting wrap pending [dates]` |
| `/cache-notes` | Fetch & embed AI transcripts as Obsidian callouts (prompts for URLs if empty) |
| `/fill-participants` | Resolve and fill Participants frontmatter |
| `/followup-todos` | Extract action items as Obsidian Tasks checkboxes |
| `/recap` | Produce a weekly/date-range recap from emails, Slack, Jira/Confluence, and vault notes |
| `/note-status` | Verify meeting notes are fully processed — shows which wrap steps are complete or missing |
| `/sync-upstream-obsidianos` | Pull structural updates from upstream ObsidianOS into the local vault |
| `/commit` | Stage and commit with flexible intent — accepts file/folder scope, free-text description, `amend`, or any combination; supports sequence mode |
