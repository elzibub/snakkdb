# SnakkDB

An open database of snack foods from around the world. The data is plain
markdown in git, the site is static, and every contribution is a pull request.

## How it works

```
snacks/<slug>/index.md        ← one product line: YAML frontmatter + English description
snacks/<slug>/photo.jpg       ← optional photo, referenced as `photo: ./photo.jpg`
manufacturers/<slug>.md       ← one company; snacks point at it by slug
redirects.json                ← old slug → new slug, for anything renamed or removed
src/content.config.ts         ← the schema: the rules every entry has to follow
src/lib/taxonomy.ts           ← categories, plus country names/flags from ISO codes
```

- **Build:** [Astro](https://astro.build) turns `snacks/` and `manufacturers/`
  into static pages (per snack, country, category and manufacturer). [Pagefind](https://pagefind.app)
  builds a search index that runs in the browser, so there's no search server.
- **Validation:** the build checks every entry against the schema. A bad
  submission fails CI on its PR with a readable error.
- **Contributing, two ways:**
  1. *Non-git people:* the "Add a snack" issue form. `issue-to-pr.yml` turns
     the issue into `snacks/<slug>/index.md` and opens a PR.
  2. *Git people:* the "Edit this page" link on every page, or a regular PR.
     GitHub handles the fork for them.
- **Deploy:** pushing to `main` builds the site and publishes it to GitHub Pages.

## The data model

**One entry is one product line.** "Pocky", not "Pocky Matcha". Flavours and
limited editions go in `variants`; the same product sold under another name
somewhere else (Pocky is sold as Mikado in Europe) goes in `aliases`. A variant
that deserves its own page can graduate to one later.

```yaml
---
name: Pocky                      # required
names:                           # the name in other scripts, with a BCP 47 language tag
  - { text: ポッキー, lang: ja }
aliases:                         # same product, different name/maker elsewhere
  - { name: Mikado, countries: [FR, DE], manufacturer: mondelez-international }
  # an old name: { name: Marathon, countries: [GB], discontinued: 1990 }
origin: JP                       # required, ISO 3166-1 alpha-2
available_in: [KR, US]           # loose, never complete
manufacturer: ezaki-glico        # slug of a file in manufacturers/
category: biscuits-cookies       # required, see src/lib/taxonomy.ts
flavors: [chocolate]
introduced: 1966
discontinued: 2019               # a year; omit if still made
variants:
  - { name: Matcha, flavors: [matcha], countries: [JP], limited: false }
related: [some-other-snack]      # slugs of connected snacks; shown on both pages
photo: ./photo.jpg               # needs photo_credit
photo_credit: "Jane Doe, CC BY 4.0"
sources: [https://en.wikipedia.org/wiki/Pocky]
---
English description in markdown.
```

- **`category`** is what the snack mostly is, not its coating: a
  chocolate-covered biscuit or wafer (Tim Tam, Pocky, KitKat, Twix) is
  `biscuits-cookies`. Chocolate bars with a soft filling (Snickers, Mars) are
  `chocolate`; chewy or hard sweets with no chocolate are `candy`.
- **`flavors`** are tastes, not textures or shapes ("chocolate", not "wafer").
  They're normalised on load: lowercase, with `&` turned into `and`, so
  "Salt & Vinegar" and "salt and vinegar" are the same flavour. Variant *names*
  stay as printed on the pack.
- **`related`** links snacks that are separate products but belong together:
  one modelled on another (Saeukkang → Kappa Ebisen), or a local brand that
  now shares a range with a global one (Walkers ↔ Lay's). Add it on one side;
  both pages show the link.
- **Variants vs. separate entries:** a variant is the same snack in a
  different flavour (Wotsits Cheese, Wotsits Sweet & Spicy) or a different pack
  (sticks vs. bags of wrapped pieces, Soreen's Lunchbox Loaves). Packs,
  portions and wrapping never make a new entry. A snack that eats differently
  (bigger pieces, a different texture or shape) gets its own entry, linked
  with `related` (Wotsits Giants, Wotsits Crunchy → Wotsits).
- **Aliases vs. separate entries:** an alias is the *same* product under
  another name. If the other name has its own history (founded separately,
  bought later), give it its own entry and link the two with `related`.

- **Same name, different snack:** when two separate products share a name
  (the US Milky Way is like a Mars bar; Europe's Milky Way is like
  3 Musketeers), each gets the name plus its origin code as the slug:
  `milky-way-us`, `milky-way-gb`. The bare `milky-way` stays free.

Manufacturers are tiny: `name`, plus optional `country`, `website` and `parent`
(another manufacturer's slug, e.g. Barcel → Grupo Bimbo). Anything under the
frontmatter, such as former company names, is shown on the manufacturer's page.

**Slugs are permanent.** The folder or file name is the URL. Lowercase `a-z`,
digits and hyphens only, and never renamed once merged. If one really has to
change, add `"snacks/old": "snacks/new"` to `redirects.json`; CI fails a PR
that removes a slug without one.

**Translations** will live next to the English file as `index.<lang>.md`
(e.g. `index.ja.md`). They aren't loaded yet, but the layout is reserved.

The build fails, with a message naming the file and field, on misspelled or
unknown fields, bad country/language codes, invalid slugs, and manufacturer
slugs that don't exist.

## Local dev

```sh
npm install
npm run dev        # http://localhost:4321 (search only works after `npm run build && npm run preview`)
```

## One-time GitHub setup

1. Create the repo (public) and push.
2. Settings → Pages → Source: **GitHub Actions**.
3. Create an issue label named `new-snack` (issue forms only apply labels that already exist).
4. Settings → Actions → General → Workflow permissions: allow Actions to
   **create pull requests**.
5. Optional: a custom domain. Point DNS at Pages, then remove the `BASE`
   env var in `ci.yml` and set `SITE` to your domain.

**Known quirk:** PRs opened by the bot with the default `GITHUB_TOKEN` don't
trigger CI (GitHub does this on purpose to stop workflow loops). Closing and
reopening the PR kicks CI off. To make it automatic, give the workflow a
GitHub App token or a fine-grained PAT instead.

## Cost

$0 for a public repo: GitHub Pages hosting, Actions minutes and storage are all
free. The limits you could eventually hit:

| Limit | Value | When it matters |
|---|---|---|
| Pages site size | 1 GB | Photos, at around 10k snacks |
| Pages bandwidth | 100 GB/month (soft) | Real popularity. Cloudflare Pages has no bandwidth cap and works as a drop-in replacement |
| Repo size | ~1 GB recommended, 5 GB hard-ish | Photos again. Keep them under ~200 KB each and enforce that in CI |
| Build time | Pages builds run up to 10 min | Tens of thousands of entries |

The only cost worth planning for is a domain name (~$10/yr), and that's optional.
