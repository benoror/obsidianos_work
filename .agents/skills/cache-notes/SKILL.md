---
name: cache-notes
description: "Fetch & embed AI transcripts as Obsidian callouts. Args: <path>, all, refresh <path>. Prompts for URLs if empty."
---

# Cache Notes

## Usage

- `/cache-notes all` — Scan all meetings with `Notes:` links that haven't been cached yet, fetch and embed them.
- `/cache-notes <path>` — Cache notes for a specific meeting file.
- `/cache-notes refresh <path>` — Re-fetch and overwrite existing cached content for a file.

If the target file has an **empty `Notes:` property** (no URLs yet), prompt the user to paste the external resource URLs (Google Docs, Otter.ai, etc.). Add them to the `Notes:` frontmatter, then proceed with fetching and caching as normal.

## How It Works

External meeting resources (Google Docs, Otter.ai) linked in frontmatter `Notes:` are fetched, parsed by provider, and embedded as **collapsible Obsidian callouts** directly in the meeting note. A `NotesCached:` frontmatter timestamp marks the file as cached.

## Frontmatter Convention

Before caching:

```yaml
Notes:
  - https://docs.google.com/document/d/{id}/edit?tab=t.{tab}
  - https://otter.ai/u/{id}
```

After caching:

```yaml
Notes:
  - https://docs.google.com/document/d/{id}/edit?tab=t.{tab}
  - https://otter.ai/u/{id}
NotesCached: 2026-02-25T15:00:00-06:00
```

## Provider: Gemini (Google Docs)

### Fetching

1. Extract document ID from the Google Docs URL in `Notes:`.
2. Call `google-workspace-get_doc_content` with the document ID.
3. The API returns content organized by tabs (`--- TAB: Notes ---`, `--- TAB: Transcript ---`).

### Parsing the Notes Tab

Gemini notes have a consistent structure. Parse into three sections:

| Section | Starts after | Ends before | Callout |
|---------|-------------|-------------|---------|
| Summary + Details | `Summary` heading | `Suggested next steps` heading | `[!gemini_notes]` |
| Suggested next steps | `Suggested next steps` heading | Gemini disclaimer footer | `[!gemini_todos]` |
| Transcript | `--- TAB: Transcript ---` | End of content | `[!gemini_transcript]` |

**Strip the Gemini disclaimer footer** — lines starting with "You should review Gemini's" or "Please provide feedback" are noise. Do not include them.

### Output Format

All cached content goes under a top-level `## 🤖 AI Notes` section appended after frontmatter. Each provider gets its own `### {Provider}` subsection. Callouts are nested under the provider heading.

```markdown
## 🤖 AI Notes

### Gemini

> [!gemini_notes]- Summary & Details
> ### Summary
> {summary text}
>
> ### Details
> {details as bullet points}

> [!gemini_todos]- Suggested Next Steps
> - {next step 1}
> - {next step 2}

> [!gemini_transcript]- Transcript
> {transcript content, if available}

### Otter

> [!otter_notes]- Summary & Details
> ...
```

**Formatting rules for callout content:**
- Every line inside a callout must start with `> `.
- Preserve markdown formatting (bold, bullet points, headings) inside callouts.
- Keep the `-` after the callout type (e.g. `[!gemini_notes]-`) — this makes it collapsed by default in Obsidian.
- Blank lines between callouts (no `>` prefix) to separate them.
- If transcript tab is not available, omit the `[!gemini_transcript]` callout entirely.
- The `## AI Transcripts` heading is created once. Provider subsections are added beneath it.
- If the file already has user-written content between frontmatter `---` and `## AI Transcripts`, preserve it. Always append `## AI Transcripts` at the end of the file.

## Provider: Otter.ai

> **Status**: TBD — Otter.ai has no API/MCP integration. For now, skip Otter links silently.
> When available, the structure will mirror Gemini with `[!otter_notes]-`, `[!otter_todos]-`, `[!otter_transcript]-`.

## Workflow

### Mode: Specific file (`/cache-notes <path>`)

1. **Read the file**. Check frontmatter for `Notes:` links and `NotesCached:`.
2. If `Notes:` is empty or absent, **prompt the user** to paste the external resource URL(s). Add them to the `Notes:` frontmatter property using `StrReplace`, then continue.
3. If `NotesCached:` exists and this is not a `refresh`, inform the user and stop.
4. **Verify each URL** before caching (see URL Verification below).
5. For each verified Google Docs URL in `Notes:`:
   a. Extract the document ID.
   b. Fetch via `google-workspace-get_doc_content`.
   c. Parse into sections.
6. Build the callout blocks.
7. If the file already has callout blocks (refresh mode), replace them. Otherwise append after frontmatter `---`.
8. Set `NotesCached:` in frontmatter to current timestamp.

### Mode: All (`/cache-notes all`)

1. Discover uncached files using QMD (see [Detecting Uncached Files](#detecting-uncached-files)).
2. Present the list to the user with count. Ask for confirmation before proceeding.
3. Process each file per the specific-file workflow above.
4. Report results: successes, failures, skipped (Otter-only).

## URL Verification

Before caching, verify that each external resource actually corresponds to the meeting note. This prevents accidentally caching the wrong document when a user pastes an incorrect URL.

### How it works

1. **Extract the meeting date** from the note. Try these sources in order until one yields a date:
   - Filename date pattern (any format — see Date Parsing below)
   - `created:` frontmatter timestamp
2. **Fetch the document title** from the Google Docs API response (the `File:` line returned by `get_doc_content`, e.g. `"Daily Standup - 2026/02/24 09:43 EST - Notes by Gemini"`).
3. **Extract the date from the doc title** (any format — see Date Parsing below).
4. **Compare**: normalize both dates to `YYYY-MM-DD` and check equality.
   - If the dates match, proceed silently.
   - If the dates **don't match**, warn the user:

```
⚠️ Date mismatch for Meetings/PAM/Scrum/2026-02-24.md:
   Note date:     2026-02-24
   Doc title:     "Daily Standup - 2026/02/26 09:41 EST - Notes by Gemini"
   Doc date:      2026-02-26

Wrong document? [Continue anyway / Skip this URL / Replace URL]
```

4. **If no date is found** in the doc title, fall back to a title similarity check — warn if the doc title has no obvious overlap with the meeting note's title (e.g. a "Sprint Retro" doc linked to a "Daily Standup" note).
5. **In batch mode** (`/cache-notes all` or `/meeting wrap pending`), collect all mismatches and present them together before proceeding, rather than interrupting one by one.

### Date Parsing

See [date-filter](../_shared/date-filter.md) § "Date Parsing" for the full list of recognized formats and ambiguity rules.

### Skip verification

Verification is skipped for:
- `refresh` mode (the URL was already verified on first cache)
- Non-Google Docs URLs (Otter.ai, etc.)

## Detecting Uncached Files

See [vault-context](../_shared/vault-context.md) for vault discovery conventions.

A file needs caching when:
- Frontmatter has `Notes:` containing a `docs.google.com` URL
- Frontmatter does NOT have `NotesCached:`

Use QMD to discover candidates:
1. `qmd-search` with query `docs.google.com/document` to find files containing Google Docs links under `Meetings/`.
2. For each candidate, read its frontmatter and check for `NotesCached:` — if present, skip it.

Grep (`Grep` tool) is still appropriate for the frontmatter-presence check (`NotesCached:`) since that's an exact-string lookup on already-identified files.

## Refresh Mode

`/cache-notes refresh <path>`:
- Delete the entire `## AI Transcripts` section and everything below it.
- Re-fetch all providers and re-build the section.
- Update `NotesCached:` timestamp.

## Offer to Commit

See [/commit](../commit/SKILL.md). Skip when called as part of a sequence (e.g. `/meeting wrap`).

## Important Notes

- Always read a file before editing — frontmatter may have changed since last read.
- Use `StrReplace` for edits, targeting the closing `---` of frontmatter as the anchor.
- The `Notes:` URLs should NOT be modified — they remain as the canonical source links.
- `NotesCached:` is the single indicator that caching was done. No other markers.
- For `all` mode, process in batches and report progress to the user.
- Gemini anonymizes some speakers as "someone in [location]" — this is expected; `/fill-participants` handles name resolution separately.
