---
name: workspace-mode
description: "Switch between named Obsidian Workspace layouts (interview / scrum / 1-on-1 / recap) for context-appropriate file/pane layouts. Wraps `obsidian workspace`."
license: MIT
---

# Workspace Mode

## Usage

- `/workspace-mode` — List available workspaces and the current one.
- `/workspace-mode <name>` — Switch to a named workspace.
- `/workspace-mode save <name>` — Save current pane layout as a new workspace (delegates to Obsidian's Workspace plugin command).

## Why this skill exists

Different work modes want different layouts:
- **interview**: Meetings.base Interviews view + the active candidate's @Name.md + a blank scratchpad pane.
- **scrum**: Today's `Meetings/Engineering/Scrum/YYYY-MM-DD.md` + Tracker.md + Meetings.base Pending view.
- **1-on-1**: OneOnOnes view + the current person's @Name.md + their last 1:1 note.
- **recap**: Recaps/ folder + Meetings.base ThisWeek view + Tracker.md.

Switching by hand means dragging panes around. This skill flips between saved layouts in one command.

## Workflow

### Step 1: List or switch

- No args → run `obsidian workspace format=json` and present the list with the current one starred.
- `<name>` arg → run `obsidian workspace load name=<name>` (or use the Obsidian "Workspaces: Load workspace" command if `load` isn't a direct subcommand: `obsidian command name="Workspaces: Load workspace layout"`).

### Step 2: Save

- `save <name>` → run `obsidian command name="Workspaces: Save layout"` then prompt for the name in Obsidian's modal. (Or use `obsidian eval` to call the plugin API directly if needed.)

## Suggested workspace presets

These don't exist out of the box — the user creates them once in Obsidian via Workspaces plugin, then this skill flips between them:

| Workspace | Files / Views Open |
|-----------|--------------------|
| `interview` | `Meetings.base` (Interviews view), latest interview note, blank scratchpad |
| `scrum` | Today's Scrum daily, `Tracker.md`, `Meetings.base` (Pending view) |
| `1-on-1` | `Meetings.base` (OneOnOnes view), `People.base` (Active view) |
| `recap` | `Recaps/Recap YYYY-MM-DD.md`, `Meetings.base` (ThisWeek view), `Tracker.md` |
| `default` | The main layout (current) |

## Important Notes

- Workspaces are stored in Obsidian's `.obsidian/workspaces.json` — they're per-vault, not per-device.
- Requires the **Workspaces** core plugin enabled in Obsidian.
- Read-only by default — only `save` writes (and that's to `.obsidian/workspaces.json`, not vault content). No commit step.
