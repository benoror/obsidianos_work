---
name: recap
description: "Produce a weekly/date-range recap from emails, Slack, Jira/Confluence, and vault notes. Args: [dates]. Default = this week."
license: MIT
compatibility: Requires qmd (CLI or MCP) and gws CLI for Gmail and Calendar (read-only). Degrades gracefully when unavailable. See [google-workspace-cli](../_shared/google-workspace-cli.md).
---

# Recap

## Usage

- `/recap` — Recap the current week (Monday through today).
- `/recap [dates]` — Recap a specific date range.

### Date Filtering

See [date-filter](../_shared/date-filter.md) for the full syntax and date parsing rules.

Default (omitted): Monday through today (current week).

## Data Sources

The recap pulls from all **available** sources. Unavailable sources are skipped gracefully with a note in the output.

| Source | Tool | Status | What to gather |
|--------|------|--------|----------------|
| Gmail | `gws` (Gmail API) | ✅ When `gws` is authenticated | Emails sent/received in the date range |
| Vault notes | QMD (CLI or MCP) | ✅ When QMD index exists | Meeting notes, daily notes, any `.md` file dated within range |
| Google Calendar | `gws` (Calendar API) | ✅ When `gws` is authenticated | Events in the date range (for context) |
| Slack | `slack` MCP (optional) | ⏳ Pending setup | Channel messages, DMs, threads |
| Jira | `atlassian` MCP (optional) | ⏳ Pending setup | Issues assigned/updated/commented, sprint activity |
| Confluence | `atlassian` MCP (optional) | ⏳ Pending setup | Pages created/updated, comments |

When a source is unavailable (`gws` / QMD / optional MCP not installed, not authenticated, or errors), log it under a `### ⏳ Unavailable Sources` section in the output and proceed with the remaining sources.

## Workflow

### Step 1: Parse date range

Resolve the `[dates]` argument into a concrete `start_date` and `end_date` (inclusive, `YYYY-MM-DD` format). Default: Monday of the current week through today.

### Step 2: Gather data

Run the following in parallel where possible:

#### 2a. Vault notes (QMD + Tracker)

See [vault-context](../_shared/vault-context.md) for the full convention.

Gather vault context for the date range: meeting notes from `Meetings/**/*` (any naming format) and `Tracker.md` (sprint/task status). Use QMD for discovery, always include the Tracker, and extract titles, participants, discussion points, existing todos, and AI summaries from each matched file.

#### 2b. Gmail

Search for emails in the date range using **`gws`** (see [google-workspace-cli](../_shared/google-workspace-cli.md)):

1. `gws gmail users messages list` with `--params` including `"userId":"me"`, `"q":"after:YYYY/MM/DD before:YYYY/MM/DD"` (use the day after `end_date` for the `before` bound), and `maxResults` (e.g. 50).
2. For each selected `id`, run `gws gmail users messages get` with `"format":"full"`. Triage from headers/snippet first; fetch full bodies for important threads only.
3. Focus on:
   - Emails **from** the user (decisions communicated, requests made)
   - Emails **to** the user that are actionable (requests, reviews, approvals)
   - Threads with multiple replies (active discussions)
   - Skip automated notifications, marketing, and calendar invites unless they contain actionable content.

#### 2c. Google Calendar

Fetch events in the date range via **`gws calendar events list`** with RFC3339 `timeMin` / `timeMax` on `calendarId: primary` (and `singleEvents`, `orderBy: startTime` as needed). See [google-workspace-cli](../_shared/google-workspace-cli.md). Use as structural context: what meetings happened, who attended, what the agenda was. Cross-reference with vault meeting notes from Step 2a.

#### 2d. Slack (when available)

Search channel history and threads for messages in the date range. Focus on:
- Channels the user actively participates in
- DMs with actionable content
- Threads where the user was mentioned or replied
- Decisions, announcements, and requests

#### 2e. Jira (when available)

Query for issues where the user is assignee, reporter, or commenter, updated within the date range. Extract:
- Status transitions (To Do → In Progress → Done)
- New issues created
- Comments and discussions
- Sprint progress if applicable

#### 2f. Confluence (when available)

Search for pages created or updated by the user (or mentioning the user) within the date range. Extract key content and comments.

### Step 3: Cross-reference and deduplicate

Before producing the summary:

1. **Merge duplicates**: The same topic may appear in email, Slack, meeting notes, and Jira. Group related items by topic/project.
2. **Identify gaps**: Flag topics that appear in one source but not others (e.g. a Slack decision that has no Jira ticket, or a meeting commitment with no follow-up email).
3. **Resolve people**: Map names to `[[@Name]]` wikilinks. See [people-resolver](../_shared/people-resolver.md).

### Step 4: Produce the recap summary

Generate a **well-structured markdown document**. Use headings, sub-headings, bullet lists, bold/italic emphasis, wikilinks, and Obsidian callouts to make the recap scannable and readable in Obsidian. Follow the template below — adapt section depth and detail to the volume of content (light weeks get concise output; busy weeks get sub-sections per project).

````markdown
---
created: YYYY-MM-DDTHH:MM:SS-06:00
period: YYYY-MM-DD..YYYY-MM-DD
sources:
  - gmail
  - vault
  - calendar
---
# Recap — YYYY-MM-DD to YYYY-MM-DD

## 🔦 Highlights

Top 5–10 significant events, decisions, or accomplishments from the period.
Each highlight is a bullet with bold project/topic label, a concise description,
and a source attribution in italics.

- **[Project/Topic]**: What happened or was decided. *(meeting note, email thread, Slack)*
- **[Project/Topic]**: Another highlight. *(source)*

For busy weeks, group highlights under `### Project/Topic` sub-headings:

### PAM Platform
- Accomplished X...
- Decided Y...

### Infrastructure
- Migrated Z...

## 📋 Open / Pending Items

Action items, requests, and commitments that are still open or need follow-up.
Use Obsidian Tasks format (see [obsidian-tasks](../_shared/obsidian-tasks.md)).
Group by project when there are many items.

### Project A
- [ ] Description 🔼 📅 YYYY-MM-DD
- [ ] [[@Name]] Description ⏫

### Ungrouped
- [ ] Standalone item 🔽

> [!tip] Items carried forward
> If any items were already tracked in previous recaps or meeting notes
> and are still open, note them here with a reference to the original source.

## 💡 Insights

Patterns, observations, or things worth noting that don't fit in the sections above.
Use sub-bullets for supporting detail.

- **Recurring theme**: Description of the pattern
  - Came up in *meeting A*, *Slack #channel*, and *email thread*
- **Gap identified**: Decision X has no follow-up Jira ticket
- **Workload note**: N meetings on Tuesday, heavy email day on Thursday

## 📊 Activity Summary

| Source | Count | Detail |
|--------|-------|--------|
| Meetings | N | *list of meetings attended* |
| Emails | N threads | N sent · N received |
| Slack | N channels | *(when available)* |
| Jira | N issues | *(when available)* |
| Vault notes | N | *notes created/modified in range* |

## ⏳ Unavailable Sources

> [!warning] Skipped sources
> List any sources that were unavailable and why (`gws` / QMD / MCP not configured, auth error, etc.)
> Remove this section entirely if all sources were available.
````

### Step 5: Present and confirm

Display the recap to the user **before** saving. Let them request adjustments (add/remove items, change priorities, fix attributions).

### Step 6: Save the recap

Save to `Recaps/YYYY-MM-DD.md` (using end_date as the filename). If `Recaps/` doesn't exist, create it.

If a recap for the same end date already exists, ask the user whether to overwrite or create a suffixed version (`YYYY-MM-DD-2.md`).

### Step 7: Offer to commit

See [/commit](../commit/SKILL.md).

## Important Notes

- **Privacy**: Email and Slack content may contain sensitive information. The recap stays local in the vault — never push to a shared repo without user consent.
- **Volume control**: For busy weeks, prioritize depth over breadth. Summarize high-volume sources (e.g. 200 emails) rather than listing every item.
- **Gmail query limits**: `gws gmail users messages list` returns paginated results. Fetch up to 50 messages per search; if more exist, note the total count and focus on the most relevant.
- **Graceful degradation**: The skill must work with just Gmail + vault notes. Slack and Atlassian are additive — their absence should not block the recap.
- **Timezone**: All dates use `-06:00` (CST). See `skill-conventions.mdc` Project Context.
