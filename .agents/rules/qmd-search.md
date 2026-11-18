# Vault Search — Prefer QMD

When the user asks to search, find, or look up content in the vault, **prefer QMD** over grep/ripgrep/Grep.

**When QMD is unavailable** (MCP down, index missing, `qmd` not on PATH): **do not abort** — fall back to `Glob`, `Read`, workspace `Grep`, or `rg`/`grep`/`sed` on known paths. See [external-auth.md](external-auth.md) § C.

## When to use QMD

- Searching for topics, concepts, or questions across notes
- Finding meeting notes, documents, or knowledge by meaning
- Looking up people, projects, or decisions mentioned in notes
- Any broad "find me X" request over markdown content

## When grep is still appropriate

- Exact string/symbol lookup (e.g. a specific frontmatter key, wikilink, or regex)
- Searching non-markdown files (configs, scripts, JSON)
- Checking for the presence of a known literal string

## How to use QMD

Use the QMD MCP tools (`mcp__qmd__query`, `mcp__qmd__get`, `mcp__qmd__multi_get`, `mcp__qmd__status`).

See [QMD SKILL](../skills/qmd/SKILL.md) for query syntax, types (lex/vec/hyde), and combining strategies.

### Quick reference

| Goal | Query type |
|---|---|
| Know exact keywords | `lex` only |
| Natural language question | `vec` |
| Don't know vocabulary | single-line query (implicit `expand`) |
| Best recall | `lex` + `vec` |
| Complex topic | `lex` + `vec` + `hyde` |

### Example

```json
{
  "searches": [
    { "type": "lex", "query": "sprint retro action items" },
    { "type": "vec", "query": "what action items came out of the sprint retrospective" }
  ],
  "limit": 10
}
```
