import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { CATEGORIES } from "./lib/taxonomy";

// Every snack lives at snacks/<slug>/index.md, with any photos next to it.
// This schema is the contract for submissions: a PR that violates it fails CI.
const snacks = defineCollection({
  loader: glob({ pattern: "*/index.md", base: "./snacks" }),
  schema: ({ image }) =>
    z.object({
      name: z.string().min(1),
      // Name in the original script/language, if different (e.g. "ポッキー").
      native_name: z.string().optional(),
      // ISO 3166-1 alpha-2 codes. First entry = country of origin.
      countries: z
        .array(z.string().regex(/^[A-Z]{2}$/, "Use ISO 3166-1 alpha-2, e.g. JP"))
        .min(1),
      manufacturer: z.string().optional(),
      category: z.enum(CATEGORIES),
      flavors: z.array(z.string()).default([]),
      introduced: z.number().int().min(1700).max(2100).optional(),
      discontinued: z.boolean().default(false),
      photo: image().optional(),
      photo_credit: z.string().optional(),
      sources: z.array(z.string().url()).default([]),
    }).refine((d) => !d.photo || d.photo_credit, {
      message: "photo_credit is required when a photo is included",
      path: ["photo_credit"],
    }),
});

export const collections = { snacks };
