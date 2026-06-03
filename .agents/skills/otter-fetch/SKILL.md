---
name: otter-fetch
description: "Fetch Otter.ai transcript data. Sub-skill used by cache-notes and fill-participants when Notes: contains an Otter URL."
license: MIT
---

# Otter Fetch

Single place for **obtaining Otter.ai transcript data**. No direct slash command — other skills invoke this when they encounter an Otter.ai URL (e.g. in `Notes:` frontmatter).

## Usage

This skill has **no slash command**. It's a sub-skill: `/cache-notes` and `/fill-participants` invoke its workflow (and run `parse_otter.js`) when a meeting's `Notes:` contains an `https://otter.ai/u/...` URL.

## When to use

- **cache-notes**: When caching a meeting that has `https://otter.ai/u/{otid}` in `Notes:` — need callout markdown to embed.
- **fill-participants**: When resolving participants for a meeting that only has Otter links (no Google Doc) — need speaker names from the transcript.

## How to get the data

Otter has no public API. Use **user-pasted JSON**:

1. **Extract `otid`** from the URL: `https://otter.ai/u/aBcDeFgHiJkLmNoPqRsT` → `otid = aBcDeFgHiJkLmNoPqRsT`.
2. **Ask the user** to copy the JSON response from `GET https://otter.ai/forward/api/v1/speech?otid={otid}` (e.g. from DevTools → Network while signed in, or from a signed-in request).
3. User pastes the JSON; the agent (or script) parses it.

## Outputs (same JSON, different consumers)

The pasted JSON has `speech` with:

| Use case | What to use | How |
|----------|-------------|-----|
| **cache-notes** | Callout markdown | Run `parse_otter.js` with JSON on stdin → stdout is `## 🤖 AI Notes` / `### Otter` block with `[!otter_notes]-`, `[!otter_todos]-`, `[!otter_transcript]-`. |
| **fill-participants** | Speaker names | From `speech.speakers`: array of `{ speaker_name }`. Use those names with [people-resolver](../_shared/people-resolver.md) to build `Participants:`. |

So one paste can serve both skills if needed (e.g. cache-notes runs the script; fill-participants reads `speech.speakers` from the same JSON or from the cached transcript callout).

## Script: parse_otter.js

In this folder: **parse_otter.js** reads the full Otter speech JSON from stdin and writes **callout markdown** to stdout (for cache-notes).

```bash
node .agents/skills/otter-fetch/parse_otter.js < pasted.json
```

Output is the exact block to append under `## 🤖 AI Notes` (including `### Otter` and the three callouts). Caller appends it to the note and sets `NotesCached:`.

## Important notes

- Always extract `otid` from the share URL (query params like `?utm_source=copy_url` can be ignored).
- If the user doesn't have the JSON, they can open the Otter meeting page while signed in, open DevTools → Network, reload, and copy the response body of the `speech?otid=...` request.
