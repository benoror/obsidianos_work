import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const ROOT = resolve(import.meta.dirname, "../../..");
export const SKILLS_DIR = resolve(ROOT, ".agents/skills");
export const FIXTURES_DIR = resolve(import.meta.dirname, "../fixtures");

export function readFile(path) {
  return readFileSync(path, "utf-8");
}

/**
 * Extract YAML frontmatter fields from a markdown file.
 * Handles scalars, lists, quoted strings, and empty values.
 */
export function parseFrontmatter(content) {
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

/** Extract markdown body after frontmatter. */
export function getBody(content) {
  const match = content.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)/);
  return match ? match[1] : content;
}

/**
 * Find all relative markdown links in content.
 * Returns [{text, target, line}] — skips URLs and anchor-only links.
 */
export function extractLinks(content) {
  const links = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    for (const m of lines[i].matchAll(/\[([^\]]*)\]\(([^)]+)\)/g)) {
      const target = m[2].split("#")[0];
      if (!target) continue;
      if (/^https?:\/\//.test(target)) continue;
      links.push({ text: m[1], target, line: i + 1 });
    }
  }
  return links;
}
