import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";

import { SKILLS_DIR, readFile, parseFrontmatter, extractLinks } from "./helpers/parse.js";
import {
  discoverSkills,
  isThirdParty,
  parseAgentsMd,
  parseSkillConventions,
  parseReadme,
  detectMcpUsage,
  KNOWN_MCP_SERVERS,
} from "./helpers/skills.js";

const skills = discoverSkills();

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

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
        assert.ok(fm.description, `${skill}/SKILL.md missing frontmatter 'description'`);
      });

      it("has 'license' in frontmatter", () => {
        assert.ok(fm.license, `${skill}/SKILL.md missing frontmatter 'license'`);
      });

      it("has ## Usage section", { skip: isThirdParty(skill) }, () => {
        assert.ok(/^## Usage/m.test(content), `${skill}/SKILL.md missing '## Usage' section`);
      });

      it("frontmatter 'name' matches directory name", () => {
        assert.equal(fm.name, skill, `frontmatter name '${fm.name}' does not match dir '${skill}'`);
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

describe("Compatibility", () => {
  for (const skill of skills) {
    const path = join(SKILLS_DIR, skill, "SKILL.md");
    const content = readFile(path);
    const fm = parseFrontmatter(content);
    const mcpUsed = detectMcpUsage(content);

    if (mcpUsed.size > 0) {
      it(`${skill} references MCP servers and declares compatibility`, () => {
        assert.ok(
          fm.compatibility,
          `${skill}/SKILL.md uses ${[...mcpUsed].join(", ")} but has no 'compatibility' field`
        );
      });

      it(`${skill} compatibility mentions all used MCP servers`, () => {
        for (const server of mcpUsed) {
          assert.ok(
            fm.compatibility.includes(server),
            `${skill}/SKILL.md uses '${server}' but compatibility doesn't mention it: '${fm.compatibility}'`
          );
        }
      });
    }

    if (fm.compatibility) {
      it(`${skill} compatibility references known MCP servers`, () => {
        const mentioned = [...KNOWN_MCP_SERVERS].filter((s) => fm.compatibility.includes(s));
        assert.ok(
          mentioned.length > 0,
          `${skill}/SKILL.md has compatibility '${fm.compatibility}' but doesn't reference any known MCP server`
        );
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Registry sync
// ---------------------------------------------------------------------------

describe("Registry sync", () => {
  const onDisk = new Set(skills.filter((s) => !isThirdParty(s)));
  const inAgentsMd = parseAgentsMd();
  const inConventions = parseSkillConventions();
  const inReadme = parseReadme();

  it("AGENTS.md lists every skill on disk", () => {
    const missing = [...onDisk].filter((s) => !inAgentsMd.has(s));
    assert.deepEqual(missing, [], `Skills on disk but missing from AGENTS.md: ${missing.join(", ")}`);
  });

  it("AGENTS.md has no extra skills", () => {
    const extra = [...inAgentsMd].filter((s) => !onDisk.has(s));
    assert.deepEqual(extra, [], `Skills in AGENTS.md but not on disk: ${extra.join(", ")}`);
  });

  it("skill-conventions.md lists every skill on disk", () => {
    const missing = [...onDisk].filter((s) => !inConventions.has(s));
    assert.deepEqual(missing, [], `Skills on disk but missing from skill-conventions.md: ${missing.join(", ")}`);
  });

  it("skill-conventions.md has no extra skills", () => {
    const extra = [...inConventions].filter((s) => !onDisk.has(s));
    assert.deepEqual(extra, [], `Skills in skill-conventions.md but not on disk: ${extra.join(", ")}`);
  });

  it("README.md lists every skill on disk", () => {
    const missing = [...onDisk].filter((s) => !inReadme.has(s));
    assert.deepEqual(missing, [], `Skills on disk but missing from README.md: ${missing.join(", ")}`);
  });

  it("README.md has no extra skills", () => {
    const extra = [...inReadme].filter((s) => !onDisk.has(s));
    assert.deepEqual(extra, [], `Skills in README.md but not on disk: ${extra.join(", ")}`);
  });

  it("all three registries list the same skills", () => {
    const a = [...inAgentsMd].sort();
    const c = [...inConventions].sort();
    const r = [...inReadme].sort();
    assert.deepEqual(a, c, "AGENTS.md and skill-conventions.md differ");
    assert.deepEqual(a, r, "AGENTS.md and README.md differ");
  });
});

// ---------------------------------------------------------------------------
// Internal links
// ---------------------------------------------------------------------------

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
