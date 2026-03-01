import { readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { SKILLS_DIR, ROOT, readFile, parseFrontmatter } from "./parse.js";

const SKIP_DIRS = new Set(["_shared"]);

export const KNOWN_MCP_SERVERS = new Set(["google-workspace", "qmd"]);

/** List skill directories (those containing SKILL.md, minus non-skill dirs). */
export function discoverSkills() {
  return readdirSync(SKILLS_DIR)
    .filter((d) => {
      if (SKIP_DIRS.has(d)) return false;
      const dir = join(SKILLS_DIR, d);
      return statSync(dir).isDirectory() && existsSync(join(dir, "SKILL.md"));
    })
    .sort();
}

/**
 * Skills with 'metadata' in frontmatter are third-party/bundled (e.g. qmd).
 * They get structure checks but are excluded from registry sync.
 */
export function isThirdParty(skill) {
  const content = readFile(join(SKILLS_DIR, skill, "SKILL.md"));
  return /^metadata:/m.test(
    content.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ""
  );
}

/** Parse top-level skill names from AGENTS.md skills table. */
export function parseAgentsMd() {
  const content = readFile(join(ROOT, "AGENTS.md"));
  const names = new Set();
  for (const m of content.matchAll(
    /\|\s*\[(\w[\w-]*)\]\(\.agents\/skills\/[\w-]+\/SKILL\.md\)/g
  )) {
    names.add(m[1]);
  }
  return names;
}

/** Parse skill names from skill-conventions.md existing-skills table. */
export function parseSkillConventions() {
  const content = readFile(
    join(ROOT, ".agents/rules/skill-conventions.md")
  );
  const names = new Set();
  for (const m of content.matchAll(/\|\s*`\/([\w-]+)`\s*\|/g)) {
    names.add(m[1]);
  }
  return names;
}

/** Parse skill names from README.md skills table. */
export function parseReadme() {
  const content = readFile(join(ROOT, "README.md"));
  const section = content.match(/## Skills\n\n([\s\S]*?)(?=\n## |\n$)/);
  if (!section) return new Set();
  const names = new Set();
  for (const m of section[1].matchAll(/\|\s*`\/([\w-]+)`\s*\|/g)) {
    names.add(m[1]);
  }
  return names;
}

/** Detect which MCP servers a skill body references. */
export function detectMcpUsage(content) {
  const found = new Set();
  if (
    /google-workspace|get_doc_content|get_doc_as_markdown|Google Calendar MCP|Google Docs API/i.test(
      content
    )
  )
    found.add("google-workspace");
  if (
    /\bqmd[_-](?:search|vector_search|get|multi_get|deep_search)\b|QMD.*discovery|Use QMD/i.test(
      content
    )
  )
    found.add("qmd");
  return found;
}
