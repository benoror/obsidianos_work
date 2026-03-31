# Google Workspace CLI (`gws`)

Skills that touch **Google Docs, Drive, Calendar, or Gmail** assume the **[Google Workspace CLI](https://github.com/googleworkspace/cli)** (`gws`) is installed, authenticated, and granted **read-only** OAuth scopes for the APIs you use (e.g. Docs, Drive, Calendar, Gmail readonly).

This vault does **not** use a Google Workspace MCP server. Agents should run `gws` via the **terminal** (repo root is fine; `gws` loads `.env` when present).

## Install & auth

See the upstream [README](https://github.com/googleworkspace/cli/blob/main/README.md). Typical flow:

```bash
brew install googleworkspace-cli   # or: npm install -g @googleworkspace/cli
gws auth setup    # optional; automates GCP project with gcloud
gws auth login    # complete OAuth in the browser; use scope presets limited to what you need
```

For **read-only** vault workflows, restrict scopes at login (example — adjust to your policy):

```bash
gws auth login --scopes drive.readonly,gmail.readonly,calendar.readonly
```

Docs content reads use the Docs API; ensure the **Google Docs API** is enabled for your GCP project and that your OAuth grant includes docs access if you use `gws docs …` (see `gws auth login --help` / upstream docs for the exact scope names).

Credentials default to `~/.config/gws/`. Optional env vars: see upstream **Environment Variables** (`GOOGLE_WORKSPACE_CLI_*`).

## Introspection

```bash
gws schema docs.documents.get
gws schema drive.files.export
gws schema calendar.events.list
gws schema gmail.users.messages.list
```

## Docs (Gemini meeting notes)

**Document title / filename verification** (Drive metadata):

```bash
gws drive files get --params '{"fileId":"<DOCUMENT_ID>","fields":"name,mimeType,id"}'
```

Use the `name` field (e.g. `Daily Standup - 2026/02/24 … - Notes by Gemini`) for date/title checks in `/cache-notes` URL verification.

**Full document structure** (multi-tab Gemini notes — tabs as structured JSON):

```bash
gws docs documents get --params '{"documentId":"<DOCUMENT_ID>","includeTabsContent":true}'
```

Parse the JSON: use `title` when helpful; walk each tab’s `documentTab.body.content` (and nested `paragraph`, `textRun`, etc.) to assemble plain text. When rebuilding the legacy “tab” layout for parsing, you may insert separators such as `--- TAB: Notes ---` / `--- TAB: Transcript ---` from tab titles and body text.

**Plain-text export** (simpler single stream; may flatten tabs):

```bash
gws drive files export --params '{"fileId":"<DOCUMENT_ID>","mimeType":"text/plain"}' -o /tmp/gemini-doc.txt
```

Then read the file and map into the `[!gemini_*]` callouts per the cache-notes skill.

## Calendar

**Today’s agenda** (helper — read-only):

```bash
gws calendar +agenda --today --format json
```

**Events in a range** (RFC3339 `timeMin` / `timeMax`, exclusive end):

```bash
gws calendar events list --params '{"calendarId":"primary","timeMin":"2026-03-31T00:00:00-06:00","timeMax":"2026-04-01T00:00:00-06:00","singleEvents":true,"orderBy":"startTime"}'
```

## Gmail

**List message IDs** (Gmail search query syntax):

```bash
gws gmail users messages list --params '{"userId":"me","q":"after:2026/03/01 before:2026/04/01","maxResults":50}'
```

**Fetch a message** (body + headers):

```bash
gws gmail users messages get --params '{"userId":"me","id":"<MESSAGE_ID>","format":"full"}'
```

Use `--page-all` where the skill needs full pagination; cap volume in the skill (e.g. top 50) to avoid noise.

## Drive

Use `gws drive files list`, `gws drive files get`, etc., with `--params` JSON as needed. Prefer **read-only** scopes; do not use write helpers (`+upload`, etc.) from these vault skills unless the user explicitly asks.

## Errors

Non-zero exit codes: see `gws` upstream (auth failures, API errors). If `gws` is missing on `PATH`, tell the user to install it and run `gws auth login`.
