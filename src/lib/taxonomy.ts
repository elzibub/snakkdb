// Keep this list short and broad; finer distinctions belong in `flavors`.
// Adding a category is a one-line PR here (and in .github/ISSUE_TEMPLATE/new-snack.yml).
// Classify by what the snack mostly is, not its coating: a chocolate-covered
// biscuit or wafer (Tim Tam, Pocky, KitKat, Twix) is biscuits-cookies. Chocolate
// bars and sweets with a soft filling (nougat, caramel, peanuts: Snickers, Mars,
// M&M's) are "chocolate"; chewy and hard sweets with no chocolate are "candy".
export const CATEGORIES = [
  "chips-crisps",
  "crackers",
  "biscuits-cookies",
  "chocolate",
  "candy",
  "gummies-jellies",
  "nuts-seeds",
  "puffs-extruded",
  "namkeen", // fried savoury South Asian snacks: bhujia, sev, chakli, Bombay mix
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
