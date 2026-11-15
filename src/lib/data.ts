import { getCollection, type CollectionEntry } from "astro:content";

export type Snack = CollectionEntry<"snacks">;
export type Manufacturer = CollectionEntry<"manufacturers">;

let cache: Promise<{ snacks: Snack[]; makers: Map<string, Manufacturer> }> | undefined;

// Loads everything once and fails the build on dangling references,
// so a typo'd manufacturer slug in a PR is caught by CI.
export function loadData() {
  return (cache ??= (async () => {
    const snacks = (await getCollection("snacks")).sort((a, b) => a.data.name.localeCompare(b.data.name));
    const makers = new Map((await getCollection("manufacturers")).map((m) => [m.id, m]));

    const errors: string[] = [];
    const check = (where: string, ref?: { id: string }) => {
      if (ref && !makers.has(ref.id)) errors.push(`${where}: unknown manufacturer "${ref.id}" (add manufacturers/${ref.id}.md)`);
    };
    for (const m of makers.values()) check(`manufacturers/${m.id}.md parent`, m.data.parent);
    for (const s of snacks) {
      check(`snacks/${s.id}`, s.data.manufacturer);
      s.data.aliases.forEach((a) => check(`snacks/${s.id} alias "${a.name}"`, a.manufacturer));
    }
    if (errors.length) throw new Error("Broken references:\n  " + errors.join("\n  "));

    return { snacks, makers };
  })());
}

export const allCountries = (s: Snack) =>
  [...new Set([s.data.origin, ...s.data.available_in, ...s.data.aliases.flatMap((a) => a.countries)])];
