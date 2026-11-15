// Converts a "new-snack" issue form body into snacks/<slug>/index.md.
// Usage: ISSUE_BODY=... node scripts/issue-to-snack.mjs   -> prints the slug
// Input is untrusted: every value is emitted as a JSON string (valid YAML),
// and the slug is restricted to [a-z0-9-].
import { mkdirSync, writeFileSync, existsSync, appendFileSync } from "node:fs";

const body = process.env.ISSUE_BODY ?? "";

// Issue forms render as "### Label\n\nvalue" blocks; "_No response_" = empty.
const fields = {};
for (const block of body.split(/^### /m).slice(1)) {
  const [label, ...rest] = block.split("\n");
  const value = rest.join("\n").trim();
  fields[label.trim().toLowerCase()] = value === "_No response_" ? "" : value;
}

const list = (s) => (s ?? "").split(",").map((x) => x.trim()).filter(Boolean);
const q = JSON.stringify;

const name = fields["name"];
if (!name) throw new Error("Missing name");

const slug = name
  .normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  .slice(0, 60) || `snack-${Date.now()}`;

let finalSlug = slug;
for (let i = 2; existsSync(`snacks/${finalSlug}`); i++) finalSlug = `${slug}-${i}`;

const lines = ["---", `name: ${q(name)}`];
if (fields["native name"]) lines.push(`native_name: ${q(fields["native name"])}`);
lines.push(`countries: ${q(list(fields["countries"]).map((c) => c.toUpperCase()))}`);
if (fields["manufacturer"]) lines.push(`manufacturer: ${q(fields["manufacturer"])}`);
lines.push(`category: ${q(fields["category"])}`);
if (fields["flavors"]) lines.push(`flavors: ${q(list(fields["flavors"]))}`);
const year = parseInt(fields["year introduced"], 10);
if (!Number.isNaN(year)) lines.push(`introduced: ${year}`);
if (fields["sources"]) lines.push(`sources: ${q(list(fields["sources"]))}`);
lines.push("---", "", fields["description"] ?? "", "");

mkdirSync(`snacks/${finalSlug}`, { recursive: true });
writeFileSync(`snacks/${finalSlug}/index.md`, lines.join("\n"));

if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `slug=${finalSlug}\n`);
console.log(finalSlug);
