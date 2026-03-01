import { readFile, parseFrontmatter, getBody } from "./parse.js";

// ---------------------------------------------------------------------------
// Pattern constants
// ---------------------------------------------------------------------------

const ISO_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;
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

// ---------------------------------------------------------------------------
// Validators — each returns string[] of violations (empty = pass)
// ---------------------------------------------------------------------------

/** Validate /meeting creation output. */
export function validateCreation(fm) {
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
export function validateCache(fm, body) {
  const errors = [];
  if (!fm.NotesCached) return errors;

  if (!ISO_TIMESTAMP.test(fm.NotesCached)) {
    errors.push(
      `'NotesCached' is not ISO 8601 with timezone: '${fm.NotesCached}'`
    );
  }

  const notes = Array.isArray(fm.Notes)
    ? fm.Notes
    : fm.Notes
      ? [fm.Notes]
      : [];
  if (!notes.some((n) => URL_PATTERN.test(n))) {
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
    if (!KNOWN_CALLOUT_TYPES.has(m[1])) {
      errors.push(`Unknown callout type: '${m[1]}'`);
    }
    if (m[2] !== "-") {
      errors.push(
        `Callout [!${m[1]}] missing collapse flag '-' (should be [!${m[1]}]-)`
      );
    }
  }

  const aiSection = body.split(/^## 🤖 AI Notes/m)[1];
  if (aiSection) {
    let inCallout = false;
    for (const line of aiSection.split("\n")) {
      if (/^> \[![\w]+\]-?/.test(line)) {
        inCallout = true;
        continue;
      }
      if (/^\[![\w]+\]-?/.test(line)) {
        errors.push(
          `Callout opener missing '> ' prefix: '${line.slice(0, 60)}'`
        );
        continue;
      }
      if (inCallout) {
        if (line === "" || line.startsWith("###")) {
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
export function validateParticipants(fm) {
  const errors = [];
  if (!("Participants" in fm)) return errors;

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
export function validateTodos(fm, body) {
  const errors = [];
  if (!fm.TodosExtracted) return errors;

  if (!ISO_TIMESTAMP.test(fm.TodosExtracted)) {
    errors.push(
      `'TodosExtracted' is not ISO 8601 with timezone: '${fm.TodosExtracted}'`
    );
  }

  const bodyBeforeAI = body.split(/^## 🤖 AI Notes/m)[0] || body;
  const taskLines = bodyBeforeAI
    .split("\n")
    .filter((l) => TASK_CHECKBOX.test(l));

  for (const line of taskLines) {
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

    if (TASK_DATE_EMOJI.test(line) && !TASK_DATE_FORMAT.test(line)) {
      errors.push(
        `Task has date emoji but no valid YYYY-MM-DD date: '${line.slice(0, 80)}'`
      );
    }
  }

  return errors;
}

/**
 * Run all applicable validators on a note file.
 * Returns { creation, cache, participants, todos } each being string[].
 */
export function validateNote(filePath) {
  const content = readFile(filePath);
  const fm = parseFrontmatter(content);
  const body = getBody(content);
  return {
    creation: validateCreation(fm),
    cache: validateCache(fm, body),
    participants: validateParticipants(fm),
    todos: validateTodos(fm, body),
  };
}
