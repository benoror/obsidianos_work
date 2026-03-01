import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";

import { FIXTURES_DIR } from "./helpers/parse.js";
import { validateNote } from "./helpers/validators.js";

const fixtures = readdirSync(FIXTURES_DIR)
  .filter((f) => f.endsWith(".md"))
  .sort();

// ---------------------------------------------------------------------------
// Valid fixtures — all contracts must pass
// ---------------------------------------------------------------------------

describe("Output contracts — valid fixtures", () => {
  const valid = fixtures.filter((f) => f.startsWith("valid-"));

  for (const file of valid) {
    describe(file, () => {
      const results = validateNote(join(FIXTURES_DIR, file));

      it("creation contract", () => {
        assert.deepEqual(results.creation, [], results.creation.join("; "));
      });

      it("cache contract", () => {
        assert.deepEqual(results.cache, [], results.cache.join("; "));
      });

      it("participants contract", () => {
        assert.deepEqual(results.participants, [], results.participants.join("; "));
      });

      it("todos contract", () => {
        assert.deepEqual(results.todos, [], results.todos.join("; "));
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Invalid fixtures — specific violations must be flagged
// ---------------------------------------------------------------------------

describe("Output contracts — invalid fixtures catch violations", () => {
  it("invalid-bad-timestamp.md: flags bad timestamps", () => {
    const r = validateNote(join(FIXTURES_DIR, "invalid-bad-timestamp.md"));
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
    const r = validateNote(join(FIXTURES_DIR, "invalid-bad-participants.md"));
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
    const r = validateNote(join(FIXTURES_DIR, "invalid-callout-format.md"));
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
    const r = validateNote(join(FIXTURES_DIR, "invalid-bad-task-format.md"));
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
