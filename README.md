<p align="center">
  <img src=".assets/ObsidianOS-logo.png" alt="ObsidianOS" width="480" />
</p>

# ObsidianOS: Work

An Obsidian vault wired with AI agent skills — an **Agentic Operating System for Thinkers**.

## Sneak Peek

Slash commands that run inside your vault, powered by any AI agent:

```
/meeting                  → Create notes from Google Calendar
/cache-notes              → Embed AI meeting transcripts
/fill-participants        → Resolve names to [[@Person]] wikilinks
/followup-todos           → Extract action items as checkboxes
/note-status              → Verify notes are fully processed
/recap                    → Weekly summary from email, Slack, Jira & vault
/commit                   → Stage & commit with inferred intent
/sync-upstream-obsidianos → Pull updates from upstream ObsidianOS
```

Agent-agnostic — works with [Cursor](https://cursor.com), [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview), [OpenCode](https://github.com/opencode-ai/opencode), or any MCP-compatible client. Clone it, fill in `USER.md`, and go.

<p align="center">
  <a href=".assets/demo-obsidian.png"><img src=".assets/demo-obsidian.png" alt="Obsidian vault demo" width="720" /></a>
</p>
<p align="center">
  <a href=".assets/demo-cursor-cli.png"><img src=".assets/demo-cursor-cli.png" alt="Cursor CLI demo — /recap this week" width="720" /></a>
</p>

## Compatible agents

| Agent | Support level | Notes |
|---|---|---|
| [Cursor](https://cursor.com) IDE | Full | Loads `.cursor/rules/` and `.cursor/mcp.json` automatically |
| [Cursor CLI](https://docs.cursor.com/cli) (`cursor`) | Full | Same engine in background/headless mode |
| [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview) | Full | Reads `AGENTS.md` + `CLAUDE.md` natively; see [CLAUDE.md](CLAUDE.md) for MCP setup |
| [OpenCode](https://github.com/opencode-ai/opencode) / [Crush](https://github.com/charmbracelet/crush) | Full | Reads `OpenCode.md`; see [OpenCode.md](OpenCode.md) for MCP setup |
| Other MCP-compatible clients | Partial | Can use the MCP servers; agent instructions won't auto-load |

## Skills

| Skill | What it does |
|---|---|
| `/meeting` | Create or wrap up meeting notes (from Google Calendar or manual) |
| `/cache-notes` | Fetch & embed AI meeting transcripts as Obsidian callouts |
| `/fill-participants` | Resolve names in notes to `[[@Person]]` wikilinks |
| `/followup-todos` | Extract action items as Obsidian Tasks checkboxes |
| `/recap` | Weekly recap from emails, Slack, Jira, and vault notes |
| `/note-status` | Verify meeting notes are fully processed (Notes, Cache, Participants, Todos) |
| `/commit` | Stage and commit — accepts file/folder scope, free-text intent, or `amend` |
| `/sync-upstream-obsidianos` | Pull structural updates from upstream ObsidianOS |

Each skill supports multiple sub-commands and arguments — see [AGENTS.md](AGENTS.md) for the full reference.

## Prerequisites

- [Cursor](https://cursor.com) IDE or [CLI](https://docs.cursor.com/cli) (or any agent that supports MCP — see [Compatible agents](#compatible-agents))
- [Node.js](https://nodejs.org/) v20+
- [Obsidian](https://obsidian.md/) (see [Obsidian plugins](#obsidian-plugins) below)
- [uvx](https://docs.astral.sh/uv/) (Python) — runs the Google Workspace MCP server

## Setup

### 1. Clone and install

```bash
git clone https://github.com/youruser/obsos_work.git
cd obsos_work
npm install
```

### 2. Fill in your identity

Edit [`USER.md`](USER.md) with your name, email, timezone, and aliases. This is the single source of truth that all skills reference — no other file needs your personal info.

### 3. Google Workspace MCP (optional)

Required for `/meeting` (Calendar), `/cache-notes` (Docs), and `/recap` (Gmail).

1. Create OAuth credentials in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (Desktop app type).
2. Enable the **Google Docs**, **Google Drive**, **Google Calendar**, and **Gmail** APIs.
3. Copy the example env and fill in your credentials:

```bash
cp .env.example .env
# Edit .env with your GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and USER_GOOGLE_EMAIL
```

On first use, the MCP server will open a browser for OAuth consent. Approve once and credentials are cached at `~/.google_workspace_mcp/`.

> [!INFO] Running it the first time will likely prompt your agent to walk you through the confiaguration step by step

See the [google_workspace_mcp](https://github.com/taylorwilsdon/google_workspace_mcp) repo for detailed setup.

### 4. QMD vault search (optional)

Required for `/recap` and vault-wide search. QMD indexes your markdown files for keyword and semantic search.

```bash
npx qmd collection add . --name my_vault
npx qmd embed
```

The `npx qmd mcp` server (configured in `.cursor/mcp.json`) will serve searches from this index. Re-run `npx qmd embed` after adding significant new content.

### 5. Vault structure

The vault ships with these directories already in place:

```
Meetings/          Meeting notes (create subfolders per team/project as needed)
Teams/People/      Person files: @Name.md (one per colleague)
Teams/             Team files: +TeamName.md
Templates/         Obsidian templates
```

A default [`Teams/People/@Me.md`](Teams/People/@Me.md) is included as the vault owner's person file. Add subfolders under `Meetings/` to organise notes by team or project (e.g. `Meetings/Eng/`, `Meetings/TBs/`).

### 6. Open in Obsidian + Cursor

Open the vault folder in both Obsidian (for viewing/editing notes) and Cursor (for running agent skills). Cursor will auto-load the MCP servers from `.cursor/mcp.json` and the rules from `.cursor/rules/`.

In Obsidian, hide non-vault folders from the file explorer: go to **Settings → Files & Links → Excluded files** and add `node_modules`.

## Obsidian plugins

The vault works with vanilla Obsidian, but these community plugins power specific features. Install whichever you need from **Settings → Community plugins → Browse**.

### Required

| Plugin | ID | Used by |
|---|---|---|
| [Tasks](https://publish.obsidian.md/tasks/) | `obsidian-tasks-plugin` | `ToDo's.md` queries, `/followup-todos` checkbox syntax, task priorities |
| [Update modified date](https://github.com/alangrainger/obsidian-frontmatter-modified-date) | `frontmatter-modified-date` | Auto-updates `modified:` in YAML frontmatter when you edit a note |

### Recommended

| Plugin | ID | What it adds |
|---|---|---|
| [Natural Language Dates](https://github.com/argentinaos/nldates-obsidian) | `nldates-obsidian` | Type `@today` or `@next Monday` to insert date links — handy for task due dates |
| [Calendar](https://github.com/liamcain/obsidian-calendar-plugin) | `calendar` | Sidebar calendar widget for navigating daily/meeting notes by date |
| [Dataview](https://github.com/blacksmithgu/obsidian-dataview) | `dataview` | Query engine for vault data — tables, lists, and tasks from frontmatter and inline fields |
| [Open Tab Settings](https://github.com/jessycormier/obsidian-open-tab-settings) | `open-tab-settings` | Tab deduplication and placement control — prevents the same note from opening twice |

### Optional (cosmetic / workflow)

These are not required by any skill but improve the day-to-day experience:

| Plugin | ID | What it adds |
|---|---|---|
| [Obsidian Git](https://github.com/Vinzent03/obsidian-git) | `obsidian-git` | Auto-backup vault to git on a schedule (alternative to `/commit`) |
| [Auto Card Link](https://github.com/nekoshita/obsidian-auto-card-link) | `auto-card-link` | Paste a URL and get a rich preview card |
| [File Explorer Note Count](https://github.com/ozntel/file-explorer-note-count) | `file-explorer-note-count` | Shows note count badges on folders |
| [Icon Folder](https://github.com/FlorianWoworte/obsidian-iconize) | `obsidian-icon-folder` | Custom icons on folders and files in the explorer |
| [Custom File Explorer Sorting](https://github.com/SebastianMC/obsidian-custom-sort) | `custom-sort` | Manual sorting rules for files and folders in the explorer |
| [Cycle Through Panes](https://github.com/phibr0/cycle-through-panes) | `cycle-through-panes` | Ctrl/Cmd+Tab to cycle through open tabs like a browser |

## Updates

If you forked or cloned this repo into a private vault, you can pull structural updates (skills, rules, shared conventions) without overwriting your personal data.

```bash
# First time — add the upstream remote
git remote add upstream <url-to-this-repo>

# Pull updates (auto-configures merge driver on first run)
./.scripts/sync-upstream.sh

# Preview what's new without merging
./.scripts/sync-upstream.sh --preview
```

Personal paths are protected during merges via `.gitattributes` — your `USER.md`, `Tracker.md`, `.env`, `.cursor/mcp.json`, `Meetings/`, `Teams/`, `Templates/`, and `Recaps/` are always kept as-is. Edit `.gitattributes` to add or remove protected paths.

## Project structure

```
.agents/skills/       Skill definitions (SKILL.md + supporting scripts)
.cursor/rules/        Cursor rules (auto-injected by glob pattern)
.cursor/mcp.json      MCP server configuration
AGENTS.md             Agent reference: skills, conventions, vault layout
USER.md               Vault owner identity (fill in after cloning)
Templates/            Obsidian note templates
```

## License

MIT
