// Slugs are permanent URLs. Fails if a PR removes or renames a snack or
// manufacturer without adding a redirect for the old slug to redirects.json.
// Usage: node scripts/check-slugs.mjs <base-ref>   (e.g. origin/main)
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const base = process.argv[2] ?? "origin/main";
const git = (...args) => execFileSync("git", args, { encoding: "utf8" });

const slugs = (ref) =>
  git("ls-tree", "-r", "--name-only", ref, "--", "snacks", "manufacturers")
    .split("\n")
    .map((p) => {
      const snack = p.match(/^snacks\/([^/]+)\/index\.md$/);
      if (snack) return `snacks/${snack[1]}`;
      const maker = p.match(/^manufacturers\/([^/]+)\.md$/);
      if (maker) return `manufacturers/${maker[1]}`;
    })
    .filter(Boolean);

const before = new Set(slugs(base));
const after = new Set(slugs("HEAD"));
const redirects = existsSync("redirects.json") ? JSON.parse(readFileSync("redirects.json", "utf8")) : {};

const missing = [...before].filter((s) => !after.has(s) && !(s in redirects));
for (const [from, to] of Object.entries(redirects)) {
  if (!after.has(to)) missing.push(`(redirect target) ${from} -> ${to} points at nothing`);
}

if (missing.length) {
  console.error(
    "These slugs were removed or renamed. Slugs are permanent URLs, so add a redirect\n" +
    'to redirects.json for each, e.g. { "snacks/old-name": "snacks/new-name" }:\n  ' +
    missing.join("\n  "),
  );
  process.exit(1);
}
console.log(`Slugs OK (${after.size} entries, ${Object.keys(redirects).length} redirects).`);
