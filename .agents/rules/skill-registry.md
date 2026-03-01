# Skill Registry — Keep in Sync

Whenever a skill's `SKILL.md` is **created, updated, or removed**, you MUST also update these files before finishing:

1. **`AGENTS.md`** (repo root) — update the `## Skills` table.
2. **`.agents/rules/skill-conventions.md`** — update the `## Existing Skills` table.

Both tables must list every skill with its slash command and a short description. Keep them consistent with each other.

## When to trigger

- A new `SKILL.md` is written → add a row to both tables.
- A skill is renamed or its description changes → update the row in both tables.
- A skill directory is deleted → remove the row from both tables.

## How to verify

After editing, confirm both tables match the current contents of `.agents/skills/` and `.agents/rules/`.
