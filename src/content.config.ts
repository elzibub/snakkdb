import { defineCollection, reference, z } from "astro:content";
import { glob } from "astro/loaders";
import { CATEGORIES } from "./lib/taxonomy";

// Slugs are permanent URLs. Lowercase latin, digits and hyphens; never renamed
// once merged (scripts/check-slugs.mjs enforces this in CI via redirects.json).
export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const slugFromPath = (dir: string) => ({ entry }: { entry: string }) => {
  const slug = entry.split("/")[0].replace(/\.md$/, "");
  if (!SLUG.test(slug)) {
    throw new Error(`${dir}/${entry}: "${slug}" is not a valid slug (lowercase a-z, 0-9, hyphens)`);
  }
  return slug;
};

const country = z.string().regex(/^[A-Z]{2}$/, "Use an ISO 3166-1 alpha-2 code, e.g. JP");
// BCP 47-ish: "ja", "zh-Hant", "pt-BR".
const lang = z.string().regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, "Use a BCP 47 language tag, e.g. ja or zh-Hant");
const year = z.number().int().min(1700).max(2100);
// Flavours are free text, normalised so the same flavour is spelled one way:
// lowercase, trimmed, single spaces, "&" written as "and" ("Salt & Vinegar" -> "salt and vinegar").
const flavor = z
  .string()
  .min(1)
  .transform((f) => f.toLowerCase().replace(/\s*&\s*/g, " and ").replace(/\s+/g, " ").trim());

// One file per company: manufacturers/<slug>.md
const manufacturers = defineCollection({
  loader: glob({ pattern: "*.md", base: "./manufacturers", generateId: slugFromPath("manufacturers") }),
  schema: z.strictObject({
    name: z.string().min(1),
    country: country.optional(),
    parent: reference("manufacturers").optional(),
    website: z.string().url().optional(),
  }),
});

// One entry per product line: snacks/<slug>/index.md (English).
// Translations go alongside as index.<lang>.md (not loaded yet).
const snacks = defineCollection({
  loader: glob({ pattern: "*/index.md", base: "./snacks", generateId: slugFromPath("snacks") }),
  schema: ({ image }) =>
    z
      .strictObject({
        name: z.string().min(1),
        // The name in other languages/scripts.
        names: z.array(z.strictObject({ text: z.string().min(1), lang })).default([]),
        // The same product sold under a different name somewhere else. Add
        // `discontinued` for a name that's no longer used (Marathon -> Snickers, 1990).
        aliases: z
          .array(
            z
              .strictObject({
                name: z.string().min(1),
                countries: z.array(country).min(1),
                manufacturer: reference("manufacturers").optional(),
                introduced: year.optional(),
                discontinued: year.optional(),
              })
              .refine((a) => !a.discontinued || !a.introduced || a.discontinued >= a.introduced, {
                message: "discontinued can't be before introduced",
                path: ["discontinued"],
              }),
          )
          .default([]),
        origin: country,
        // Loose and never complete; "you can find it here".
        available_in: z.array(country).default([]),
        manufacturer: reference("manufacturers").optional(),
        category: z.enum(CATEGORIES),
        flavors: z.array(flavor).default([]),
        introduced: year.optional(),
        discontinued: year.optional(),
        // Flavours, sizes, limited editions. A distinctive variant can get its own page later.
        variants: z
          .array(
            z.strictObject({
              name: z.string().min(1),
              flavors: z.array(flavor).default([]),
              countries: z.array(country).default([]),
              limited: z.boolean().default(false),
              introduced: year.optional(),
              discontinued: year.optional(),
            }),
          )
          .default([]),
        // Other snacks this one is connected to: modelled on, sister brand, rebadge.
        // Links show up on both pages, so it only needs adding on one side.
        related: z.array(reference("snacks")).default([]),
        photo: image().optional(),
        photo_credit: z.string().optional(),
        sources: z.array(z.string().url()).default([]),
      })
      .refine((d) => !d.photo || d.photo_credit, {
        message: "photo_credit is required when a photo is included",
        path: ["photo_credit"],
      })
      .refine((d) => !d.discontinued || !d.introduced || d.discontinued >= d.introduced, {
        message: "discontinued can't be before introduced",
        path: ["discontinued"],
      }),
});

export const collections = { snacks, manufacturers };
