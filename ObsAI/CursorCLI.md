---
modified: 2026-02-25T10:34:10-06:00
created: 2026-02-25T09:26:57-06:00
---
# Google Wrokspace MCP

https://github.com/taylorwilsdon/google_workspace_mcp

```sh
export GOOGLE_OAUTH_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_OAUTH_CLIENT_SECRET="GOCSPX-your-secret"
export USER_GOOGLE_EMAIL="you@example.com"
```

# ToDo's

- [ ] Can you create a skill for yourself called `/meeting` that can A) Create a new meeting file with with a "{title} - YYYY-MM-DD" format B) Optionally select a specific meeting from today's Google Calendar and create the appropriate note (we'll need to add & setup a Google Calendar integration for this)
- [ ] Can you create a skill for yourself called `/fill-participants` which can A) accept `all` argument to scan all meetings with *explicit* missing participants and fill them out with confirmations & conventions workflow (what we just did), and B) accept an optional argument for an specific existing meeting note
- [ ] On your Otter.ai question: There's no official MCP server or API client for Otter.ai. Your options would be:
  1. Bulk export from Otter.ai — Go to otter.ai > Settings > Export, download all transcripts as .txt files, and
     drop them into your vault (e.g., a Transcripts/ folder). Then I could read them directly.
  2. Browser automation — A custom script using Playwright/Puppeteer to log in and scrape transcript content, but
     that's fragile.
  3. Otter.ai API (if available on your plan) — Otter has a limited API for Enterprise plans that could be wrapped
     in an MCP server, but it's not publicly documented for personal/team plans.

  The most practical path is option 1 — export and save locally.