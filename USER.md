# User Profile

This file is the single source of truth for the vault owner's identity. Skills, rules, and agents reference this instead of hardcoding user info. Fill in your details below after cloning.

The vault owner's person file is [`[[@Me]]`](Teams/People/@Me.md).

## Identity

- **Full name**: `<your full name>`
- **Short name**: `<nickname>`
- **Aliases**: `<other names you go by>`
- **Email**: `<you@example.com>`

## Location & Timezone

- **Location**: `<City, Country>`
- **Timezone**: `<UTC offset>` (e.g. `-05:00`, `+01:00`)
- **ISO format**: `YYYY-MM-DDTHH:MM:SS<offset>`

## AI Transcript Anonymization

Gemini and other AI transcript providers anonymize speakers by location. Add patterns that refer to you:

- "someone in `<City>`"
- "someone in `<Country>`"

## Agent Behavior

- When the user is the assignee of a task, **omit** the `[[@Name]]` prefix — leave it as just `- [ ] Description`.
- Do NOT create wikilinks for the user's **Full name**, **Short name**, or **Aliases** — use `[[@Me]]` if a self-reference is needed.
- References to the user in meeting transcripts should be treated as first-person context, not third-party.
