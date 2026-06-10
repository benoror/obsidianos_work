# Contributing

Thanks for improving ObsidianOS! This repo is an **agentic Obsidian vault template** — skills, rules, Bases, and docs — not personal meeting data.

## Where to edit

| What | Path |
|------|------|
| Skills | [`.agents/skills/{name}/SKILL.md`](.agents/skills/) |
| Shared conventions | [`.agents/skills/_shared/`](.agents/skills/_shared/) |
| Agent rules | [`.agents/rules/`](.agents/rules/) |
| Registry tables | [`AGENTS.md`](AGENTS.md), [`README.md`](README.md) § Skills, [`.agents/rules/skill-conventions.md`](.agents/rules/skill-conventions.md) |
| Bases | [`Meetings.base`](Meetings.base), [`People.base`](People.base) |
| Batch scripts | [`.scripts/`](.scripts/) |

Edit **`.agents/skills/` only** — [`.cursor/skills`](.cursor/skills), [`.claude/skills`](.claude/skills), and [`skills/`](skills/) are symlinks.

## Adding or changing a skill

1. Read [skill-conventions](.agents/rules/skill-conventions.md) and [skill-registry](.agents/rules/skill-registry.md).
2. Create or update `SKILL.md` with `name`, `description`, `license: MIT`, and `compatibility` when the skill uses **gws**, **qmd**, or **Obsidian CLI**.
3. Register the skill in **AGENTS.md**, **README.md** § Skills, and **skill-conventions.md** § Existing Skills.
4. Run **`npm test`** — structure, registry sync, link lint, output contracts, Bases view refs, and script unit tests.

## Conventions

- **Examples**: Use generic names (`Jane Doe`, `Alex Kim`) and `Meetings/Engineering/` paths — no real employer or colleague data.
- **Frontmatter writes**: Prefer `obsidian property:set` per [frontmatter-mutations](.agents/skills/_shared/frontmatter-mutations.md); batch scripts may edit YAML inline when documented.
- **Vault search**: Prefer QMD or Obsidian Bases over grep — see [qmd-search](.agents/rules/qmd-search.md) and [vault-context](.agents/skills/_shared/vault-context.md).
- **Commits**: Conventional style — `feat(skill): …`, `docs: …`, `test: …`, `chore: …`.

## Tests

```bash
npm test
```

Runs Node skill/output lint tests and Python unit tests for `.scripts/gmail_ai_transcripts_to_meetings.py`.

## Personal data

Do **not** commit real meeting notes, people files with private info, or `memory/feedback_meeting-routing.md` (use the [`.example`](memory/feedback_meeting-routing.md.example) template). Protected merge paths are listed in [`.gitattributes`](.gitattributes).

## License

MIT — see [LICENSE](LICENSE).
