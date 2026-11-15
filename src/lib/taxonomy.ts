// Keep this list short and broad; finer distinctions belong in `flavors`.
// Adding a category is a one-line PR here.
export const CATEGORIES = [
  "chips-crisps",
  "crackers",
  "biscuits-cookies",
  "chocolate",
  "candy",
  "gummies-jellies",
  "nuts-seeds",
  "puffs-extruded",
  "baked-goods",
  "dried-meat-seafood",
  "dried-fruit",
  "ice-cream-frozen",
  "drinks",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const categoryLabel = (c: string) =>
  c.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" / ");

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
export const countryName = (code: string) => regionNames.of(code) ?? code;

// Regional-indicator emoji flag from an ISO code; no flag assets needed.
export const flag = (code: string) =>
  String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
