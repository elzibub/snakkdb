import { defineConfig } from "astro/config";
import { readFileSync } from "node:fs";

// SITE and BASE are set by the deploy workflow. For GitHub Pages project sites
// the base is "/<repo-name>"; for a custom domain leave BASE unset.
const base = process.env.BASE ?? "/";
const prefix = base.replace(/\/$/, "");
// redirects.json maps old slug -> new slug, e.g. { "snacks/old-name": "snacks/new-name" }.
// Every removed or renamed slug must appear there (enforced by scripts/check-slugs.mjs).
// Astro doesn't add the base to redirect destinations, so we do.
const redirects = Object.fromEntries(
  Object.entries(JSON.parse(readFileSync("./redirects.json", "utf8"))).map(([from, to]) => [`/${from}/`, `${prefix}/${to}/`]),
);

export default defineConfig({
  site: process.env.SITE ?? "http://localhost:4321",
  base,
  trailingSlash: "always",
  redirects,
});
