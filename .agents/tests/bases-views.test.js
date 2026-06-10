import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { ROOT, readFile } from "./helpers/parse.js";

const FIXTURE = join(import.meta.dirname, "fixtures/otter-speech-minimal.json");
const PARSER = join(ROOT, ".agents/skills/otter-fetch/parse_otter.js");

describe("parse_otter.js", () => {
  it("emits AI Notes callouts from minimal Otter JSON", () => {
    const input = readFileSync(FIXTURE, "utf-8");
    const r = spawnSync("node", [PARSER], { input, encoding: "utf-8" });
    assert.equal(r.status, 0, r.stderr || r.stdout);
    assert.match(r.stdout, /^## 🤖 AI Notes/m);
    assert.match(r.stdout, /\[!otter_notes\]-/);
    assert.match(r.stdout, /\[!otter_todos\]-/);
    assert.match(r.stdout, /\[!otter_transcript\]-/);
    assert.match(r.stdout, /Jane Doe:/);
    assert.match(r.stdout, /roadmap/i);
  });
});

/** View names referenced by skills via `Meetings.base view=X` or `People.base view=X`. */
function collectSkillViewRefs() {
  const skillsDir = join(ROOT, ".agents/skills");
  const refs = [];
  for (const skill of readdirSync(skillsDir)) {
    const path = join(skillsDir, skill, "SKILL.md");
    try {
      const content = readFile(path);
      for (const m of content.matchAll(
        /(Meetings|People)\.base view=(\w+)/g
      )) {
        refs.push({ base: m[1], view: m[2] });
      }
    } catch {
      /* skip non-skill dirs */
    }
  }
  return refs;
}

function viewNamesInBase(basePath) {
  const content = readFile(basePath);
  const names = new Set();
  for (const m of content.matchAll(/^\s+name:\s+(.+)$/gm)) {
    names.add(m[1].replace(/^["']|["']$/g, ""));
  }
  return names;
}

describe("Bases views", () => {
  const meetingsViews = viewNamesInBase(join(ROOT, "Meetings.base"));
  const peopleViews = viewNamesInBase(join(ROOT, "People.base"));

  it("Meetings.base and People.base define expected views", () => {
    assert.ok(meetingsViews.size >= 5, "Meetings.base should define multiple views");
    assert.ok(peopleViews.size >= 1, "People.base should define at least one view");
  });

  for (const { base, view } of collectSkillViewRefs()) {
    it(`${base}.base defines view "${view}" referenced by skills`, () => {
      const names = base === "Meetings" ? meetingsViews : peopleViews;
      assert.ok(names.has(view), `missing view ${view} in ${base}.base`);
    });
  }
});

describe("vault-context Bases references", () => {
  it("documents expected Meetings.base view names", () => {
    const content = readFile(
      join(ROOT, ".agents/skills/_shared/vault-context.md")
    );
    for (const view of ["Pending", "Inbox", "CachePending"]) {
      assert.match(content, new RegExp(view));
    }
  });
});
