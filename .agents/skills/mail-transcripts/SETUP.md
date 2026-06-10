# Gmail transcript automation setup

Mode for **`/mail-transcripts`** and step 1 of **`/meeting wrap`**. Drains Gemini notification emails into meeting `Notes:` frontmatter via [`.scripts/gmail_ai_transcripts_to_meetings.py`](../../../.scripts/gmail_ai_transcripts_to_meetings.py).

## Prerequisites

1. **[Google Workspace CLI](https://github.com/googleworkspace/cli)** (`gws`) installed and authenticated.
2. **Gmail OAuth scopes** including **`gmail.modify`** (the script marks processed messages read).
3. **Python 3** on your `PATH` (`python3`).
4. Vault folder layout under `Meetings/` (see [README.md](../../../README.md) § Vault structure).

## Gmail label and filter

1. Create a label named exactly **`🤖-ai-transcripts`** (includes the robot emoji).
2. Create a filter that applies the label to Gemini messages, for example:
   - Subject contains `Notes by Gemini`
   - Or subject matches `Notes: "…"` pattern from Gemini meeting summaries
3. Keep filtered messages in **Inbox** — the script query is:

```text
label:🤖-ai-transcripts in:inbox
```

To change the query, edit `GMAIL_Q` in the Python script and update [mail-transcripts/SKILL.md](SKILL.md) § Gmail filter.

## Customize meeting routing

Edit `resolve_path()` in [`.scripts/gmail_ai_transcripts_to_meetings.py`](../../../.scripts/gmail_ai_transcripts_to_meetings.py). Default routes:

| Title pattern | Destination |
|---------------|-------------|
| Daily standup | `Meetings/Engineering/Scrum/YYYY-MM-DD.md` |
| Sprint planning / retro / grooming | `Meetings/Engineering/Scrum/…` |
| Tech / team leads weekly | `Meetings/Engineering/TechLeads/…` |
| Interview … | `Meetings/Interviews/…` |
| Everything else | `Meetings/_inbox/` → triage with **`/organize-meetings`** |

Also set `LOCAL_TZ` if you want `created:` timestamps in your local offset (default: UTC).

## Run

From the vault root:

```bash
python3 .scripts/gmail_ai_transcripts_to_meetings.py
```

Or invoke **`/mail-transcripts`** from your agent.

## After the script runs

- New notes land in routed folders or `_inbox/`.
- Run **`/organize-meetings`** to move `_inbox/` files to the correct subfolder.
- Run **`/meeting wrap pending`** or **`/cache-notes all`** to embed transcripts.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `gws: command not found` | Install CLI; ensure it is on `PATH` |
| Auth / scope errors | Re-run `gws auth login` with Gmail modify scope |
| `Found 0 message(s)` | Check label name (emoji!), filter, and that messages stay in Inbox |
| Wrong meeting file | Adjust `resolve_path()` or move the note manually |
| Subject `skip` in summary | Subject didn't match `Notes: "Title" Mon DD, YYYY` — extend `parse_subject_date()` if needed |

See also [google-workspace-cli](../_shared/google-workspace-cli.md) for raw `gws gmail` commands.
