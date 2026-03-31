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
/followup-todos           → Extract action items as plain markdown bullets (no Tasks checkboxes)
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
| [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview) | Full | Reads `AGENTS.md` + `CLAUDE.md` natively; see [CLAUDE.md](CLAUDE.md) for QMD MCP setup |
| [OpenCode](https://github.com/opencode-ai/opencode) / [Crush](https://github.com/charmbracelet/crush) | Full | Reads `OpenCode.md`; see [OpenCode.md](OpenCode.md) for QMD MCP setup |
| [OpenClaw](https://docs.openclaw.ai/) | Full | Workspace skills in `skills/` (symlink to `.agents/skills/`); config in `~/.openclaw/openclaw.json` |
| Other MCP-compatible clients | Partial | Can use the QMD MCP server; agent instructions won't auto-load |

## Skills

| Skill | What it does |
|---|---|
| `/meeting` | Create or wrap up meeting notes (from Google Calendar or manual) |
| `/cache-notes` | Fetch & embed AI meeting transcripts as Obsidian callouts |
| `/fill-participants` | Resolve names in notes to `[[@Person]]` wikilinks |
| `/followup-todos` | Extract action items as plain markdown bullets (no Tasks checkboxes) |
| `/recap` | Weekly recap from emails, Slack, Jira, and vault notes |
| `/note-status` | Verify meeting notes are fully processed (Notes, Cache, Participants, Todos) |
| `/commit` | Stage and commit — accepts file/folder scope, free-text intent, or `amend` |
| `/sync-upstream-obsidianos` | Pull structural updates from upstream ObsidianOS |
| `defuddle` | Clean markdown from URLs via Defuddle CLI |
| `json-canvas` | JSON Canvas (`.canvas`) authoring |
| `obsidian-bases` | Obsidian Bases (`.base`) views, filters, formulas |
| `obsidian-cli` | Vault operations via the `obsidian` CLI (Obsidian must be running) |
| `obsidian-markdown` | Obsidian Flavored Markdown conventions |

Each skill supports multiple sub-commands and arguments — see [AGENTS.md](AGENTS.md) for the full reference. **Skill proxies:** `.cursor/skills`, `.claude/skills`, `.opencode/skills`, and repo-root `skills/` are symlinks to `.agents/skills/` so Cursor, Claude Code, OpenCode, and OpenClaw share one canonical tree.

## Prerequisites

- [Cursor](https://cursor.com) IDE or [CLI](https://docs.cursor.com/cli) (or any agent that supports MCP — see [Compatible agents](#compatible-agents))
- [Node.js](https://nodejs.org/) v20+
- [Obsidian](https://obsidian.md/) (see [Obsidian plugins](#obsidian-plugins) below)
- [**Google Workspace CLI**](https://github.com/googleworkspace/cli) (`gws`) — optional; required for `/meeting` (Calendar), `/cache-notes` / `/fill-participants` (Docs/Drive), and `/recap` (Gmail/Calendar). Install per **§ 3** in [Setup](#setup) below.

## Setup

### 1. Clone and install

```bash
git clone https://github.com/youruser/obsos_work.git
cd obsos_work
npm install
```

### 2. Fill in your identity

Edit [`USER.md`](USER.md) with your name, email, timezone, and aliases. This is the single source of truth that all skills reference — no other file needs your personal info.

### 3. Google Workspace CLI (optional)

Required for **`/meeting`** (list today’s Calendar events), **`/cache-notes`** / **`/fill-participants`** (read Gemini Google Docs), and **`/recap`** (Gmail + Calendar). All of these workflows are **read-only**; use OAuth scopes limited to what you need (e.g. Drive/Docs/Calendar/Gmail readonly).

1. Install **`gws`** — pick one:
   - [GitHub Releases](https://github.com/googleworkspace/cli/releases) (pre-built binary)
   - `brew install googleworkspace-cli`
   - `npm install -g @googleworkspace/cli`
2. Authenticate (browser flow):

```bash
gws auth login
```

Use a scope preset or `--scopes` that includes **readonly** access for the APIs you use. Credentials are stored under `~/.config/gws/` by default. Optional env vars: see [.env.example](.env.example) and the upstream [README](https://github.com/googleworkspace/cli/blob/main/README.md).

3. Command examples for agents are in [.agents/skills/_shared/google-workspace-cli.md](.agents/skills/_shared/google-workspace-cli.md).

> [!NOTE]
> Google Workspace is **not** exposed via MCP in this vault — agents run `gws` in the **terminal**. [Cursor](https://cursor.com) still loads **QMD** from `.cursor/mcp.json` only.

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

Open the vault folder in both Obsidian (for viewing/editing notes) and Cursor (for running agent skills). Cursor will auto-load MCP servers from `.cursor/mcp.json` (this repo ships **QMD** only) and the rules from `.cursor/rules/`. Install and log in to **`gws`** separately for Google Workspace features.

In Obsidian, hide non-vault folders from the file explorer: go to **Settings → Files & Links → Excluded files** and add `node_modules`.

## Obsidian plugins

The vault works with vanilla Obsidian, but these community plugins power specific features. Install whichever you need from **Settings → Community plugins → Browse**.

### Required

| Plugin | ID | Used by |
|---|---|---|
| [Tasks](https://publish.obsidian.md/tasks/) | `obsidian-tasks-plugin` | `ToDo's.md` queries, task checkboxes & priorities elsewhere in the vault |
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

### Optional (agent skills: Obsidian CLI stack)

These line up with the bundled [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) agent skills (`obsidian-cli`, `json-canvas`, `obsidian-bases`, `obsidian-markdown`). None are extra Community plugins unless noted — turn on the features you use, and keep **Obsidian running** when an agent drives the vault via the [Obsidian CLI](https://help.obsidian.md/cli).

| Feature | ID / setup | Agent skill |
|---|---|---|
| [Obsidian CLI](https://help.obsidian.md/cli) | Install/update from the [Obsidian download](https://obsidian.md/download) page; enable CLI support per help | `obsidian-cli` |
| [Canvas](https://help.obsidian.md/canvas) | Core | `json-canvas` |
| [Bases](https://help.obsidian.md/bases) | Core | `obsidian-bases` |
| [Obsidian Flavored Markdown](https://help.obsidian.md/syntax) | Core | `obsidian-markdown` |

The `defuddle` skill uses the [Defuddle](https://www.npmjs.com/package/defuddle) CLI (`npm install -g defuddle`), not an Obsidian plugin.

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

You can also run `/sync-upstream-obsidianos` from any supported agent — it wraps the same script with an interactive preview and merge flow.

Personal paths are protected during merges via `.gitattributes` — your `USER.md`, `Tracker.md`, `.env`, `.cursor/mcp.json`, `Meetings/`, `Teams/`, `Templates/`, and `Recaps/` are always kept as-is. Edit `.gitattributes` to add or remove protected paths.

## Project structure

```
.agents/skills/       Skill definitions (SKILL.md + supporting scripts)
.agents/rules/        Shared rules (single source of truth for all agents)
.claude/skills/       Symlink → .agents/skills (Claude Code discovery)
.cursor/rules/        Cursor rules (auto-injected by glob; point to .agents/rules/)
.cursor/mcp.json      MCP configuration (QMD vault search)
.cursor/skills/       Symlink → .agents/skills (Cursor)
.opencode/skills/     Symlink → .agents/skills (OpenCode)
skills/               Symlink → .agents/skills (OpenClaw workspace skills)
AGENTS.md             Agent reference: skills, conventions, vault layout
CLAUDE.md             Claude Code instructions + MCP setup
OpenCode.md           OpenCode / Crush instructions + MCP setup
USER.md               Vault owner identity (fill in after cloning)
Templates/            Obsidian note templates
```

## License

MIT
