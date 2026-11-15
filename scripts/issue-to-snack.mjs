// Converts a "new-snack" issue form body into snacks/<slug>/index.md, plus a
// stub manufacturers/<slug>.md if the manufacturer is new.
// Usage: ISSUE_BODY=... node scripts/issue-to-snack.mjs   -> prints the snack slug
// Input is untrusted: every value is emitted as a JSON string (valid YAML),
// and slugs are restricted to [a-z0-9-]. Bad codes etc. are left for CI to reject.
import { mkdirSync, writeFileSync, existsSync, appendFileSync } from "node:fs";

const body = process.env.ISSUE_BODY ?? "";

// Issue forms render as "### Label\n\nvalue" blocks; "_No response_" = empty.
const fields = {};
for (const block of body.split(/^### /m).slice(1)) {
  const [label, ...rest] = block.split("\n");
  const value = rest.join("\n").trim();
  fields[label.trim().toLowerCase()] = value === "_No response_" ? "" : value;
}
const f = (label) => fields[label] ?? "";

const list = (s) => s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
const codes = (s) => list(s).map((c) => c.toUpperCase());
const q = JSON.stringify;
const slugify = (s) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

const name = f("name");
if (!name) throw new Error("Missing name");

const base = slugify(name) || `snack-${Date.now()}`;
let slug = base;
for (let i = 2; existsSync(`snacks/${slug}`); i++) slug = `${base}-${i}`;

// Manufacturer: reuse an existing file with the same slug, otherwise create a stub.
let makerSlug;
if (f("manufacturer")) {
  makerSlug = slugify(f("manufacturer"));
  if (makerSlug && !existsSync(`manufacturers/${makerSlug}.md`)) {
    mkdirSync("manufacturers", { recursive: true });
    writeFileSync(`manufacturers/${makerSlug}.md`, `---\nname: ${q(f("manufacturer"))}\n---\n`);
  }
}

const lines = ["---", `name: ${q(name)}`];
if (f("local name")) {
  lines.push("names:", `  - { text: ${q(f("local name"))}, lang: ${q(f("local name language") || "und")} }`);
}
lines.push(`origin: ${q(f("country of origin").toUpperCase())}`);
if (f("also sold in")) lines.push(`available_in: ${q(codes(f("also sold in")))}`);
if (makerSlug) lines.push(`manufacturer: ${q(makerSlug)}`);
lines.push(`category: ${q(f("category"))}`);
if (f("flavors")) lines.push(`flavors: ${q(list(f("flavors")))}`);
const year = parseInt(f("year introduced"), 10);
if (!Number.isNaN(year)) lines.push(`introduced: ${year}`);
const variants = f("variants").split("\n").map((v) => v.replace(/^[-*]\s*/, "").trim()).filter(Boolean);
if (variants.length) lines.push("variants:", ...variants.map((v) => `  - { name: ${q(v)} }`));
if (f("sources")) lines.push(`sources: ${q(list(f("sources")))}`);
lines.push("---", "", f("description"), "");

mkdirSync(`snacks/${slug}`, { recursive: true });
writeFileSync(`snacks/${slug}/index.md`, lines.join("\n"));

if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `slug=${slug}\n`);
console.log(slug);
