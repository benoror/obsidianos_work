---
name: onboard-person
description: "Create or enrich a Teams/People/@Name.md file with metadata pulled from external sources (an ATS for hiring data, a profile source for bio). Replaces manual data entry for newly-hired teammates."
license: MIT
---

# Onboard Person

## Usage

- `/onboard-person <Name>` — Create or enrich `Teams/People/@<Name>.md`. Pulls from available MCPs (an applicant-tracking system for hiring data, a professional-network profile source for bio).
- `/onboard-person @<Name>` — Same; bracket-less form also accepted.
- `/onboard-person <Name> --candidate` — Treat as a candidate stub (lower-confidence frontmatter, parked in `Teams/People/Candidates/`).

## Why this skill exists

When a new teammate joins, manually creating their `@Name.md` file means hopping between your ATS, a profile source, and the vault to copy FullName, Team, Location, Start Date, and so on. This skill consolidates the data pull and stub creation into one prompt.

It's complementary to `/people-stubs`: that one creates empty stubs from unresolved wikilinks; this one fills out a single stub with real metadata.

## Workflow

### Step 1: Check what exists

- `Teams/People/@<Name>.md` exists? → enrich mode (add missing properties, never overwrite existing ones)
- Doesn't exist? → create mode

### Step 2: Gather metadata

Try the following sources in order, accumulating what each returns. Which MCPs are available depends on your setup — examples below:

| Source | MCP / tool | Pulls |
|--------|-----------|-------|
| ATS (if MCP available, e.g. Greenhouse) | the ATS's MCP tools (when set up) | FullName, Role, Start Date, Hiring manager, Team (mapped from job → team) |
| Profile source (if MCP available, e.g. LinkedIn) | the profile MCP (when set up) | FullName, Location, Job title, Profile URL |
| Manual fallback | Prompt the user | Whatever's missing |

If neither MCP is set up yet, gracefully fall back to manual input — prompt the user for each property one at a time, defaults filled in from the wikilink display name (e.g. `[[@Jane Doe]]` → `FullName: Jane Doe`).

### Step 3: Resolve Team

Use known mappings (e.g. eng membership → `[[+Engineering]]`, design → `[[+Design]]`, etc.). Cross-reference with `Teams/+TeamName.md` files via `obsidian list folders path=Teams` to confirm the team file exists.

If team is ambiguous, ask the user.

### Step 4: Write the file

Use `obsidian create path="Teams/People/@<Name>.md" content="<frontmatter + body>"`. Frontmatter shape:

```yaml
---
FullName: <Full Name>
Team: "[[+<TeamFile>]]"
Location: <Country flag emoji>
Office: <City, if applicable>
Start Date: <YYYY-MM-DD>
created: <ISO 8601 with offset>
---
#team-<short> #<role-tag>
```

Body: usually empty for new stubs. If pulled from a profile source, add a single-line bio.

### Step 5: Verify

Run `obsidian property:read name=FullName path="Teams/People/@<Name>.md"` to confirm the write. If `--candidate`, ALSO verify the file is in `Teams/People/Candidates/`.

### Step 6: Commit

See [/commit](../commit/SKILL.md). Commit message: `chore(people): onboard @<Name> (<Team>)`.

## Edge Cases

- **MCPs not yet set up**: skill falls back to interactive prompting. Note in output: "ATS MCP not configured — used manual entry. Set up via /mcp."
- **Conflicting data**: if the ATS says Team A but the user manually says Team B, prefer manual input. Log the conflict.
- **Name collision**: if `Teams/People/@<Name>.md` exists with non-empty content, switch to enrich mode (additive only, no overwrites).
- **Candidate handling**: if `--candidate`, write to `Teams/People/Candidates/@<Name>.md` instead. This keeps the main `Teams/People/` clean for actual teammates and prevents candidates from polluting `People.base` Active view (which filters by `file.folder == "Teams/People"` and would not match a sub-folder).

## Important Notes

- **Never overwrite** an existing non-empty property. Use enrich (fill blanks) only.
- The skill creates a file; subsequent skills (like `/fill-participants`) consume it. Order matters when bulk-onboarding from a fresh batch of interview notes.
- Candidates folder filtering: ensure `People.base` Active view filter (`file.folder == "Teams/People"`) excludes sub-folders. If not, candidates will show up.
