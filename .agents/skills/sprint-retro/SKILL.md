---
name: sprint-retro
description: "Draft a Sprint Retro by synthesizing scrum dailies, recaps, the sprint planning note, and the prior retro. Args: [sprint number | dates]. No args = infer the current sprint."
license: MIT
compatibility: Requires qmd (CLI or MCP) for vault search. Reads recaps, scrum dailies, and the Tracker.
---

# Sprint Retro

Synthesize a draft Sprint Retro from everything already in the vault — daily standups, weekly recaps, the sprint planning note, and the previous retro — so the live retro starts from a populated document instead of a blank template.

## Usage

- `/sprint-retro` — Infer the current/most-recent sprint from the prior retro + cadence.
- `/sprint-retro <N>` — Draft the retro for sprint number `N`.
- `/sprint-retro <dates>` — Use an explicit sprint window (e.g. `2026-05-19..2026-06-02`).

### Date Filtering

See [date-filter](../_shared/date-filter.md) for date-range syntax and parsing.

## Output format (mandatory)

Mirror [followup-todos](../followup-todos/SKILL.md) — the retro is a **bullet document, not a task list**:

- **Never** insert Obsidian **Tasks** / checkbox lines: no `- [ ]`, `- [x]`, `- [-]`, `- [?]` — including in the **Action items** section.
- **Never** append Tasks date tokens (`📅`, `🛫`, `⏳`). Write dates inline in prose / ISO (e.g. "by **2026-06-01**").
- A single trailing **priority emoji** (`🔺` `⏫` `🔼` `🔽`) as **plain text** is fine when it reads naturally.
- **Always** use plain list items: `- Description…`. Wikilinks (`[[@Name]]`, `[[Recap …]]`), `[PROJ-123](url)` links, and **bold** are encouraged.

## File naming convention (mandatory)

Sprint artifacts in `Meetings/Engineering/Scrum/` follow a single pattern — keep it consistent:

- Retro: **`Sprint <N> Retro <YYYY-MM-DD>.md`** (date = sprint **end** date / retro day).
- Planning: **`Sprint <N> Planning <YYYY-MM-DD>.md`** (date = planning meeting day).

Never leave an undated `Sprint N Retro.md` or a `<Team> - Sprint Planning …` variant. If you encounter one while gathering context, flag it and offer to `git mv` it into the canonical form (updating any `[[wikilinks]]` that reference the old name).

## Workflow

### Step 1: Determine sprint number and window

1. **Verify the current date** (see Date Verification in [skill-conventions](../../rules/skill-conventions.md)): `date +%F`.
2. List `Meetings/Engineering/Scrum/Sprint * Retro *.md` to find the **prior retro** (`Sprint <N-1> Retro <date>`).
3. Derive this sprint:
   - **Number** = prior + 1 (or the explicit `<N>` arg).
   - **Window** = the day after the prior retro's end through this sprint's retro day. Retros land on a **biweekly cadence** (same weekday, ~14 days apart) — extrapolate, then sanity-check against the planning note's date and the scrum dailies present.
4. Confirm the resolved sprint number and `start..end` window with the user if anything is ambiguous (missing prior retro, irregular cadence, mid-sprint run).

### Step 2: Gather sources

See [vault-context](../_shared/vault-context.md). Gather in parallel:

| Source | Where | What to extract |
|--------|-------|-----------------|
| Scrum dailies | `Meetings/Engineering/Scrum/YYYY-MM-DD.md` within the window | Yesterday/Today/Blockers, ticket IDs, merges, incidents, decisions |
| Recaps | `Recaps/Recap *.md` whose `period:` overlaps the window | Highlights, decisions, open items, insights, cross-team notes |
| Sprint planning | `Sprint <N> Planning <date>.md` | Committed tickets, estimates, decisions — to measure against outcomes |
| Prior retro | `Sprint <N-1> Retro <date>.md` | Open **Action items** to carry forward and check off |
| Tracker | `Tracker.md` | Current ticket status (Done / Blocked / Paused / WIP) |

Prefer `qmd` over `grep` for discovery (see [qmd](../qmd/SKILL.md)). Resolve names to `[[@Name]]` via [people-resolver](../_shared/people-resolver.md).

### Step 3: Synthesize

Distill the gathered material into the retro sections, attributing each bullet to its source(s) with wikilinks (e.g. `([[Recap 2026-05-31]], [[Meetings/Engineering/Scrum/2026-05-28]])`). Enrich bullets with Jira links (`[PROJ-1234](https://your-org.atlassian.net/browse/PROJ-1234)`) where a ticket is referenced.

- **Went Well / Start doing** — shipped tickets, milestones, unblocks, demos.
- **Didn't Go Well / Stop doing** — misses, recurring blockers, process friction, deadline pressure. Note cross-sprint patterns.
- **Keep doing / Shoutouts** — one bullet per person, citing their concrete contributions. Only include people with evidence in the sources; don't invent contributions.
- **Discussion/Proposals** — open questions, decisions to make, timelines.
- **Action items** — concrete next steps (plain bullets, see output rules), including carried-over items from the prior retro.

### Step 4: Compose the document

Base structure on [Templates/Sprint Retro.md](../../../Templates/Sprint%20Retro.md), with these additions used by recent retros:

````markdown
---
Notes:
created: YYYY-MM-DDTHH:MM:SS-06:00
Participants: "[[+Engineering]]"
---

# Sprint <N> Retro — <YYYY-MM-DD>

**Sprint:** <N> · **<start>** → **<end>**

Planning context: [[Sprint <N> Planning <date>]]

> [!info] Draft synthesized from the vault
> Bullets below are distilled from **Scrum dailies** (`<start>`–`<end>`), the recaps covering this window, and the **[[Sprint <N> Planning <date>]]** commitments. Adjust after the live retro or paste a Confluence URL into `Notes:`.

### ▶️ Start doing / Went Well

- …

### 🛑 Stop doing / Didn't Go Well

- …

### 🙌 Keep doing / Shoutouts

- **[[@Name]]** — …

## Discussion/Proposals

- …

## Action items

- … 🔼
- Carry: … ⏫

## Sources (vault index)

| Kind | Notes |
| --- | --- |
| Recaps | [[Recap …]] (range), [[Recap …]] (range) |
| Scrum DS | [[Meetings/Engineering/Scrum/<start>]] … [[Meetings/Engineering/Scrum/<end>]] |
| Grooming / forums | [[Sprint <N> Planning <date>]] |
| Prior retro | [[Sprint <N-1> Retro <date>]] |
````

Leave `Notes:` empty for the user to paste the Confluence retro URL. Never set `modified:` manually (Obsidian manages it).

### Step 5: Present and confirm

Show the draft to the user **before** saving. Let them adjust bullets, attributions, shoutouts, and action items.

### Step 6: Save

Save to `Meetings/Engineering/Scrum/Sprint <N> Retro <end-date>.md` — see the naming convention above. If a retro for the sprint already exists, ask whether to overwrite.

### Step 7: Offer to commit

See [/commit](../commit/SKILL.md).

## Important Notes

- **Draft, not gospel** — the output is a synthesis to seed the live retro; flag it as such in the `[!info]` callout and expect the user to revise.
- **Evidence-only shoutouts** — only credit contributions that appear in the sources; omit team members with no traceable activity rather than guessing.
- **Cadence is a heuristic** — biweekly same-weekday is the norm, but planning/retro days drift; always cross-check the derived window against the actual scrum dailies and planning-note date.
- **Naming consistency** — if you touch sibling planning/retro files with non-canonical names, normalize them via `git mv` and fix referencing wikilinks (see the convention section).
- **No checkboxes** — this is a discussion artifact; keep it bullets-only per the output rules, matching `/followup-todos`.
- **Timezone** — dates use the vault owner's offset (e.g. `-06:00`). See [skill-conventions](../../rules/skill-conventions.md) Project Context.
