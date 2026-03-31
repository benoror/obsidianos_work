# Google Calendar + `gws` setup

Mode B (`/meeting` with no args) lists today’s events via the **[Google Workspace CLI](https://github.com/googleworkspace/cli)** (`gws`), not an MCP server.

## Prerequisites

1. Install `gws` — see [README.md](../../../README.md) § Google Workspace CLI and [google-workspace-cli](../_shared/google-workspace-cli.md).
2. Run `gws auth login` and include **Calendar** read-only scope (and any other APIs you use for vault skills).

## Fetching today’s events

From the vault root (or any directory — `gws` uses your saved credentials):

```bash
gws calendar +agenda --today --format json
```

For a custom range, use `gws calendar events list` with `timeMin` / `timeMax` (RFC3339). Examples: [google-workspace-cli](../_shared/google-workspace-cli.md).

## Troubleshooting

- **`gws: command not found`** — Install the CLI and ensure it is on your `PATH`.
- **Auth / scope errors** — Run `gws auth login` again; verify Calendar API is enabled for your GCP project.
- **Empty agenda** — Check timezone (`gws calendar +agenda --today --timezone America/Chicago`); confirm events live on the **primary** calendar or pass `--calendar` if you use a named calendar.
