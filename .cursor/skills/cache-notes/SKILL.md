---
name: cache-notes
description: Fetches external meeting resources (Gemini Google Docs, Otter.ai) and caches them inline as collapsible Obsidian callouts. Saves tokens and API calls on subsequent reads. Use when the user says /cache-notes or asks to cache, embed, or download meeting notes.
---

# Cache Notes

## Usage

- `/cache-notes all` — Scan all meetings with `Notes:` links that haven't been cached yet, fetch and embed them.
- `/cache-notes <path>` — Cache notes for a specific meeting file.
- `/cache-notes refresh <path>` — Re-fetch and overwrite existing cached content for a file.

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
2. If `NotesCached:` exists and this is not a `refresh`, inform the user and stop.
3. For each Google Docs URL in `Notes:`:
   a. Extract the document ID.
   b. Fetch via `google-workspace-get_doc_content`.
   c. Parse into sections.
4. Build the callout blocks.
5. If the file already has callout blocks (refresh mode), replace them. Otherwise append after frontmatter `---`.
6. Set `NotesCached:` in frontmatter to current timestamp.

### Mode: All (`/cache-notes all`)

1. Find all `.md` files under `Meetings/` that have `Notes:` with a Google Docs URL but no `NotesCached:`.
2. Present the list to the user with count. Ask for confirmation before proceeding.
3. Process each file per the specific-file workflow above.
4. Report results: successes, failures, skipped (Otter-only).

## Detecting Uncached Files

A file needs caching when:
- Frontmatter has `Notes:` containing a `docs.google.com` URL
- Frontmatter does NOT have `NotesCached:`

Use grep to find candidates:
- Has Google Docs link: `grep -rl 'docs.google.com/document' Meetings/`
- Already cached: `grep -rl '^NotesCached:' Meetings/`
- Difference = files needing caching

## Refresh Mode

`/cache-notes refresh <path>`:
- Delete the entire `## AI Transcripts` section and everything below it.
- Re-fetch all providers and re-build the section.
- Update `NotesCached:` timestamp.

## Important Notes

- Always read a file before editing — frontmatter may have changed via iCloud sync.
- Use `StrReplace` for edits, targeting the closing `---` of frontmatter as the anchor.
- The `Notes:` URLs should NOT be modified — they remain as the canonical source links.
- `NotesCached:` is the single indicator that caching was done. No other markers.
- For `all` mode, process in batches and report progress to the user.
- Gemini anonymizes some speakers as "someone in [location]" — this is expected; `/fill-participants` handles name resolution separately.
