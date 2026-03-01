import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const FIXTURES = resolve(import.meta.dirname, "fixtures");

// ---------------------------------------------------------------------------
// Frontmatter parser (handles scalars, lists, and quoted strings)
// ---------------------------------------------------------------------------

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm = {};
  let currentKey = null;

  for (const line of match[1].split("\n")) {
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const val = kvMatch[2].trim();
      if (val === "") {
        fm[currentKey] = null;
      } else if (val.startsWith('"') || val.startsWith("'")) {
        fm[currentKey] = val.replace(/^["']|["']$/g, "");
      } else {
        fm[currentKey] = val;
      }
      continue;
    }
    const listMatch = line.match(/^\s+-\s+(.*)/);
    if (listMatch && currentKey) {
      if (!Array.isArray(fm[currentKey])) {
        fm[currentKey] = fm[currentKey] != null ? [fm[currentKey]] : [];
      }
      fm[currentKey].push(listMatch[1].replace(/^["']|["']$/g, "").trim());
    }
  }
  return fm;
}

function getBody(content) {
  const match = content.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)/);
  return match ? match[1] : content;
}

// ---------------------------------------------------------------------------
// Validators — each returns string[] of violations (empty = pass)
// ---------------------------------------------------------------------------

const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const URL_PATTERN = /^https?:\/\//;
const WIKILINK_PERSON = /^\[\[@[^\]]+\]\]$/;
const WIKILINK_TEAM = /^\[\[\+[^\]]+\]\]$/;
const INTENTIONALLY_BLANK = /^—$/;
const TASK_CHECKBOX = /^(\t*)?- \[.\]/;
const VALID_PRIORITIES = ["🔺", "⏫", "🔼", "🔽"];
const TASK_DATE_EMOJI = /[📅🛫⏳➕✅❌]/u;
const TASK_DATE_FORMAT = /[📅🛫⏳➕✅❌]\s+\d{4}-\d{2}-\d{2}/u;
const KNOWN_CALLOUT_TYPES = new Set([
  "gemini_notes",
  "gemini_todos",
  "gemini_transcript",
  "otter_notes",
  "otter_todos",
  "otter_transcript",
]);

/** Validate /meeting creation output. */
function validateCreation(fm) {
  const errors = [];
  if (!fm) return ["No frontmatter found"];
  if (!fm.created) {
    errors.push("Missing 'created' in frontmatter");
  } else if (!ISO_TIMESTAMP.test(fm.created)) {
    errors.push(`'created' is not ISO 8601 with timezone: '${fm.created}'`);
  }
  if (!("Notes" in fm)) {
    errors.push("Missing 'Notes' property in frontmatter");
  }
  return errors;
}

/** Validate /cache-notes output. */
function validateCache(fm, body) {
  const errors = [];
  if (!fm.NotesCached) return errors; // step not done, skip

  if (!ISO_TIMESTAMP.test(fm.NotesCached)) {
    errors.push(
      `'NotesCached' is not ISO 8601 with timezone: '${fm.NotesCached}'`
    );
  }

  const notes = Array.isArray(fm.Notes) ? fm.Notes : fm.Notes ? [fm.Notes] : [];
  const hasUrl = notes.some((n) => URL_PATTERN.test(n));
  if (!hasUrl) {
    errors.push("'NotesCached' is set but 'Notes' has no URLs");
  }

  if (!/^## 🤖 AI Notes/m.test(body)) {
    errors.push("Missing '## 🤖 AI Notes' section in body");
  }

  const calloutOpeners = [...body.matchAll(/^> \[!([\w]+)\](-?)/gm)];
  if (calloutOpeners.length === 0) {
    errors.push("No callout blocks found under AI Notes section");
  }

  for (const m of calloutOpeners) {
    const type = m[1];
    const collapsed = m[2];
    if (!KNOWN_CALLOUT_TYPES.has(type)) {
      errors.push(`Unknown callout type: '${type}'`);
    }
    if (collapsed !== "-") {
      errors.push(
        `Callout [!${type}] missing collapse flag '-' (should be [!${type}]-)`
      );
    }
  }

  // Check callout structure inside AI Notes section
  const aiSection = body.split(/^## 🤖 AI Notes/m)[1];
  if (aiSection) {
    let inCallout = false;
    for (const line of aiSection.split("\n")) {
      if (/^> \[![\w]+\]-?/.test(line)) {
        inCallout = true;
        continue;
      }
      // Bare callout opener without blockquote prefix
      if (/^\[![\w]+\]-?/.test(line)) {
        errors.push(
          `Callout opener missing '> ' prefix: '${line.slice(0, 60)}'`
        );
        continue;
      }
      if (inCallout) {
        if (line === "") {
          inCallout = false;
          continue;
        }
        if (line.startsWith("###")) {
          inCallout = false;
          continue;
        }
        if (!line.startsWith("> ") && line !== ">") {
          errors.push(
            `Callout content line not prefixed with '> ': '${line.slice(0, 60)}'`
          );
        }
      }
    }
  }

  return errors;
}

/** Validate /fill-participants output. */
function validateParticipants(fm) {
  const errors = [];
  if (!("Participants" in fm)) return errors; // step not done, skip

  const raw = fm.Participants;
  if (raw == null) {
    errors.push("'Participants' is present but empty");
    return errors;
  }

  const values = Array.isArray(raw) ? raw : [raw];
  for (const v of values) {
    if (
      !WIKILINK_PERSON.test(v) &&
      !WIKILINK_TEAM.test(v) &&
      !INTENTIONALLY_BLANK.test(v)
    ) {
      errors.push(
        `Participant '${v}' is not a valid wikilink ([[@Name]], [[+Team]]) or '—'`
      );
    }
  }
  return errors;
}

/** Validate /followup-todos output. */
function validateTodos(fm, body) {
  const errors = [];
  if (!fm.TodosExtracted) return errors; // step not done, skip

  if (!ISO_TIMESTAMP.test(fm.TodosExtracted)) {
    errors.push(
      `'TodosExtracted' is not ISO 8601 with timezone: '${fm.TodosExtracted}'`
    );
  }

  // Validate task lines in body (outside callouts)
  const bodyBeforeAI = body.split(/^## 🤖 AI Notes/m)[0] || body;
  const taskLines = bodyBeforeAI
    .split("\n")
    .filter((l) => TASK_CHECKBOX.test(l));

  for (const line of taskLines) {
    // Check priority emojis are valid (if any priority-like emoji present)
    const priorityEmojis = line.match(/[🔺⏫🔼🔽❗⚠️]/gu);
    if (priorityEmojis) {
      for (const p of priorityEmojis) {
        if (!VALID_PRIORITIES.includes(p)) {
          errors.push(
            `Invalid priority emoji '${p}' in task: '${line.slice(0, 80)}'`
          );
        }
      }
    }

    // Check date formats (if date emoji present, ensure YYYY-MM-DD follows)
    if (TASK_DATE_EMOJI.test(line) && !TASK_DATE_FORMAT.test(line)) {
      errors.push(
        `Task has date emoji but no valid YYYY-MM-DD date: '${line.slice(0, 80)}'`
      );
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

/**
 * Run all applicable validators on a note file.
 * Returns { creation, cache, participants, todos } each being string[].
 */
function validateNote(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const fm = parseFrontmatter(content);
  const body = getBody(content);
  return {
    creation: validateCreation(fm),
    cache: validateCache(fm, body),
    participants: validateParticipants(fm),
    todos: validateTodos(fm, body),
  };
}

// ---------------------------------------------------------------------------
// Fixture tests
// ---------------------------------------------------------------------------

const fixtures = readdirSync(FIXTURES)
  .filter((f) => f.endsWith(".md"))
  .sort();

describe("Output contracts — valid fixtures", () => {
  const valid = fixtures.filter((f) => f.startsWith("valid-"));

  for (const file of valid) {
    describe(file, () => {
      const results = validateNote(join(FIXTURES, file));

      it("creation contract", () => {
        assert.deepEqual(results.creation, [], results.creation.join("; "));
      });

      it("cache contract", () => {
        assert.deepEqual(results.cache, [], results.cache.join("; "));
      });

      it("participants contract", () => {
        assert.deepEqual(
          results.participants,
          [],
          results.participants.join("; ")
        );
      });

      it("todos contract", () => {
        assert.deepEqual(results.todos, [], results.todos.join("; "));
      });
    });
  }
});

describe("Output contracts — invalid fixtures catch violations", () => {
  it("invalid-bad-timestamp.md: flags bad timestamps", () => {
    const r = validateNote(join(FIXTURES, "invalid-bad-timestamp.md"));
    assert.ok(
      r.creation.some((e) => /created.*not ISO 8601/.test(e)),
      `Expected 'created' timestamp error, got: ${r.creation}`
    );
    assert.ok(
      r.cache.some((e) => /NotesCached.*not ISO 8601/.test(e)),
      `Expected 'NotesCached' timestamp error, got: ${r.cache}`
    );
    assert.ok(
      r.todos.some((e) => /TodosExtracted.*not ISO 8601/.test(e)),
      `Expected 'TodosExtracted' timestamp error, got: ${r.todos}`
    );
  });

  it("invalid-bad-participants.md: flags non-wikilink participants", () => {
    const r = validateNote(join(FIXTURES, "invalid-bad-participants.md"));
    assert.ok(
      r.participants.length >= 2,
      `Expected at least 2 participant violations, got ${r.participants.length}: ${r.participants}`
    );
    assert.ok(
      r.participants.some((e) => /Zak/.test(e)),
      "Should flag 'Zak' (missing wikilink brackets)"
    );
    assert.ok(
      r.participants.some((e) => /@Carlos/.test(e)),
      "Should flag '@Carlos' (missing wikilink brackets)"
    );
    assert.ok(
      !r.participants.some((e) => /Valid/.test(e)),
      "'[[@Valid]]' should pass"
    );
  });

  it("invalid-callout-format.md: flags missing collapse and bare opener", () => {
    const r = validateNote(join(FIXTURES, "invalid-callout-format.md"));
    assert.ok(
      r.cache.some((e) => /missing collapse flag/.test(e)),
      `Expected collapse flag error, got: ${r.cache}`
    );
    assert.ok(
      r.cache.some((e) => /missing '> ' prefix/.test(e)),
      `Expected bare opener error, got: ${r.cache}`
    );
  });

  it("invalid-bad-task-format.md: flags bad date format and invalid priority", () => {
    const r = validateNote(join(FIXTURES, "invalid-bad-task-format.md"));
    assert.ok(
      r.todos.some((e) => /date emoji but no valid/.test(e)),
      `Expected date format error, got: ${r.todos}`
    );
    assert.ok(
      r.todos.some((e) => /Invalid priority emoji/.test(e)),
      `Expected invalid priority error, got: ${r.todos}`
    );
  });
});
