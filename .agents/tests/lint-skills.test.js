import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const SKILLS_DIR = join(ROOT, ".agents/skills");

// Dirs under .agents/skills/ that are not skills
const SKIP_DIRS = new Set(["_shared"]);

// Skills with 'license' in frontmatter are third-party/bundled.
// They get structure checks but are excluded from registry sync.
function isThirdParty(skill) {
  const content = readFile(join(SKILLS_DIR, skill, "SKILL.md"));
  return /^license:/m.test(content.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFile(path) {
  return readFileSync(path, "utf-8");
}

/** Extract YAML frontmatter fields from a markdown file. */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fields = {};
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^(\w[\w-]*):\s*(.+)/);
    if (kv) fields[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
  }
  return fields;
}

/** List skill directories (those containing SKILL.md, minus SKIP_DIRS). */
function discoverSkills() {
  return readdirSync(SKILLS_DIR)
    .filter((d) => {
      if (SKIP_DIRS.has(d)) return false;
      const dir = join(SKILLS_DIR, d);
      return (
        statSync(dir).isDirectory() && existsSync(join(dir, "SKILL.md"))
      );
    })
    .sort();
}

/**
 * Parse skill names from a markdown table.
 * Each parser returns the set of skill names found.
 */
function parseAgentsMd() {
  const content = readFile(join(ROOT, "AGENTS.md"));
  const names = new Set();
  // Top-level skill rows: | [name](.agents/skills/name/SKILL.md) |
  for (const m of content.matchAll(
    /\|\s*\[(\w[\w-]*)\]\(\.agents\/skills\/[\w-]+\/SKILL\.md\)/g
  )) {
    names.add(m[1]);
  }
  return names;
}

function parseSkillConventions() {
  const content = readFile(
    join(ROOT, ".agents/rules/skill-conventions.md")
  );
  const names = new Set();
  // Rows: | `/skill-name` |
  for (const m of content.matchAll(/\|\s*`\/([\w-]+)`\s*\|/g)) {
    names.add(m[1]);
  }
  return names;
}

function parseReadme() {
  const content = readFile(join(ROOT, "README.md"));
  // Only parse the ## Skills table, not the sneak-peek block
  const section = content.match(/## Skills\n\n([\s\S]*?)(?=\n## |\n$)/);
  if (!section) return new Set();
  const names = new Set();
  for (const m of section[1].matchAll(/\|\s*`\/([\w-]+)`\s*\|/g)) {
    names.add(m[1]);
  }
  return names;
}

/**
 * Find all relative markdown links in content.
 * Returns [{text, target, line}] — skips URLs and anchor-only links.
 */
function extractLinks(content) {
  const links = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    for (const m of lines[i].matchAll(/\[([^\]]*)\]\(([^)]+)\)/g)) {
      const target = m[2].split("#")[0]; // strip anchor
      if (!target) continue; // anchor-only
      if (/^https?:\/\//.test(target)) continue; // URL
      links.push({ text: m[1], target, line: i + 1 });
    }
  }
  return links;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const skills = discoverSkills();

describe("Skill structure", () => {
  for (const skill of skills) {
    describe(skill, () => {
      const path = join(SKILLS_DIR, skill, "SKILL.md");
      const content = readFile(path);
      const fm = parseFrontmatter(content);

      it("has 'name' in frontmatter", () => {
        assert.ok(fm.name, `${skill}/SKILL.md missing frontmatter 'name'`);
      });

      it("has 'description' in frontmatter", () => {
        assert.ok(
          fm.description,
          `${skill}/SKILL.md missing frontmatter 'description'`
        );
      });

      it("has ## Usage section", { skip: isThirdParty(skill) }, () => {
        assert.ok(
          /^## Usage/m.test(content),
          `${skill}/SKILL.md missing '## Usage' section`
        );
      });

      it("frontmatter 'name' matches directory name", () => {
        assert.equal(
          fm.name,
          skill,
          `frontmatter name '${fm.name}' does not match dir '${skill}'`
        );
      });
    });
  }
});

describe("Registry sync", () => {
  const onDisk = new Set(skills.filter((s) => !isThirdParty(s)));
  const inAgentsMd = parseAgentsMd();
  const inConventions = parseSkillConventions();
  const inReadme = parseReadme();

  it("AGENTS.md lists every skill on disk", () => {
    const missing = [...onDisk].filter((s) => !inAgentsMd.has(s));
    assert.deepEqual(
      missing,
      [],
      `Skills on disk but missing from AGENTS.md: ${missing.join(", ")}`
    );
  });

  it("AGENTS.md has no extra skills", () => {
    const extra = [...inAgentsMd].filter((s) => !onDisk.has(s));
    assert.deepEqual(
      extra,
      [],
      `Skills in AGENTS.md but not on disk: ${extra.join(", ")}`
    );
  });

  it("skill-conventions.md lists every skill on disk", () => {
    const missing = [...onDisk].filter((s) => !inConventions.has(s));
    assert.deepEqual(
      missing,
      [],
      `Skills on disk but missing from skill-conventions.md: ${missing.join(", ")}`
    );
  });

  it("skill-conventions.md has no extra skills", () => {
    const extra = [...inConventions].filter((s) => !onDisk.has(s));
    assert.deepEqual(
      extra,
      [],
      `Skills in skill-conventions.md but not on disk: ${extra.join(", ")}`
    );
  });

  it("README.md lists every skill on disk", () => {
    const missing = [...onDisk].filter((s) => !inReadme.has(s));
    assert.deepEqual(
      missing,
      [],
      `Skills on disk but missing from README.md: ${missing.join(", ")}`
    );
  });

  it("README.md has no extra skills", () => {
    const extra = [...inReadme].filter((s) => !onDisk.has(s));
    assert.deepEqual(
      extra,
      [],
      `Skills in README.md but not on disk: ${extra.join(", ")}`
    );
  });

  it("all three registries list the same skills", () => {
    const a = [...inAgentsMd].sort();
    const c = [...inConventions].sort();
    const r = [...inReadme].sort();
    assert.deepEqual(a, c, "AGENTS.md and skill-conventions.md differ");
    assert.deepEqual(a, r, "AGENTS.md and README.md differ");
  });
});

describe("Internal links", () => {
  for (const skill of skills) {
    const path = join(SKILLS_DIR, skill, "SKILL.md");
    const content = readFile(path);
    const links = extractLinks(content);

    for (const link of links) {
      it(`${skill}/SKILL.md:${link.line} → ${link.target}`, () => {
        const decoded = decodeURIComponent(link.target);
        const resolved = resolve(dirname(path), decoded);
        assert.ok(
          existsSync(resolved),
          `Broken link: [${link.text}](${link.target}) — resolved to ${resolved}`
        );
      });
    }
  }
});
