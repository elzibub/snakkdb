import { defineConfig } from "astro/config";

// SITE and BASE are set by the deploy workflow. For GitHub Pages project sites
// the base is "/<repo-name>"; for a custom domain leave BASE unset.
export default defineConfig({
  site: process.env.SITE ?? "http://localhost:4321",
  base: process.env.BASE ?? "/",
  trailingSlash: "always",
});
