---
name: mail-transcripts
description: "Gmail AI transcript notifications → meeting Notes: URLs + mark read. Args: (none). Invoked standalone or as step 1 of /meeting wrap."
license: MIT
compatibility: Requires [Google Workspace CLI](https://github.com/googleworkspace/cli) (`gws`) with **Gmail** access (list/get/modify messages). See [google-workspace-cli](../_shared/google-workspace-cli.md).
---

# Mail Transcripts

> **Setup**: [SETUP.md](SETUP.md) — Gmail label, OAuth scopes, and `resolve_path()` customization.

## Usage

- **`/mail-transcripts`** — Run the Gmail → vault sync **once** (no arguments).

### When to run

| Caller | When |
|--------|------|
| **Standalone** | Whenever you want to drain the AI-transcript inbox without wrapping meetings. |
| **`/meeting wrap <path>`** | **Step 1** — *Before* `/cache-notes`, so `Notes:` is filled from Gmail when Gemini emails beat manual paste. |
| **`/meeting wrap pending …`** | **Step 1** — *Before* discovering pending meetings, so newly linked or auto-created notes are included in the pending scan. |

## Gmail filter

Fixed query (do not change without updating this skill and the script):

```text
label:🤖-ai-transcripts in:inbox
```

The label name includes the emoji **`🤖`** (robot). Ensure that label exists in Gmail and that transcript notifications are delivered into **Inbox** with that label applied.

## Workflow

### Step 1: Preconditions

1. Confirm **`gws`** is installed and authenticated (`gws auth status`).
2. Confirm Gmail OAuth includes **read + modify** message scopes (marking read uses `users.messages.modify`).

### Step 2: Run the vault script

From the **vault root**, run:

```bash
python3 .scripts/gmail_ai_transcripts_to_meetings.py
```

Implementation lives in [`.scripts/gmail_ai_transcripts_to_meetings.py`](../../../.scripts/gmail_ai_transcripts_to_meetings.py). The script:

1. Lists messages matching the query (paginated up to `maxResults` in script — currently 100).
2. For each message, decodes MIME parts, extracts **`https://docs.google.com/document/d/...`** URLs.
3. Parses the subject line **`Notes: "Title" Mon DD, YYYY`** (supports curly `"` `"` Unicode quotes).
   A bare **`Meeting Summary for <recurring meeting>`** (no `Notes:` pattern) maps to that meeting using the email **`Date`** header.
4. **Resolves** `Meetings/**/*.md` targets using title + date heuristics (daily standups → `Meetings/Engineering/Scrum/YYYY-MM-DD.md`, tech-leads → `Meetings/Engineering/TechLeads/`, interviews → `Meetings/Interviews/`, etc. — see script `resolve_path()`). Edit that function to match your own folder conventions.
5. **Updates** existing notes: appends the Doc URL under `Notes:` if that document ID is not already present.
6. **Creates** a minimal meeting stub if no file exists (`Notes:`, `created:`, `# Title - YYYY-MM-DD`) — agents may refine folder/title afterward.
7. **Marks each processed message read** by removing the **`UNREAD`** label via `gws gmail users messages modify`.

### Step 3: Report

Print a short summary: created paths, updated paths, `noop` (URL already in note), `skip_no_doc` (no Doc URL in body — still marked read if the script marks those), and any errors.

## Important Notes

- **No Google Doc in email** (e.g. narrative-only "Meeting Summary"): the script cannot set `Notes:`; it may still mark the thread read — adjust script behavior there if you want to leave unread for triage.
- **Wrong meeting matched**: resolution is heuristic; fix `resolve_path()` in the script or move/rename the note in Obsidian.
- **Privacy**: transcript emails stay in Gmail; the skill only links Docs into local vault files.
- **Do not duplicate** `mail-transcripts` logic in other skills — call the script or point here.

## Offer to commit

When `/mail-transcripts` is run **standalone**, offer [/commit](../commit/SKILL.md). When run **inside** `/meeting wrap` or `/meeting wrap pending`, the parent sequence commits once at the end (include any new/updated meeting files in that commit scope).
