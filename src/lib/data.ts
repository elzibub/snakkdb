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

    const ids = new Set(snacks.map((s) => s.id));
    const errors: string[] = [];
    const check = (where: string, ref?: { id: string }) => {
      if (ref && !makers.has(ref.id)) errors.push(`${where}: unknown manufacturer "${ref.id}" (add manufacturers/${ref.id}.md)`);
    };
    for (const m of makers.values()) check(`manufacturers/${m.id}.md parent`, m.data.parent);
    for (const s of snacks) {
      check(`snacks/${s.id}`, s.data.manufacturer);
      s.data.aliases.forEach((a) => check(`snacks/${s.id} alias "${a.name}"`, a.manufacturer));
      for (const r of s.data.related) {
        if (r.id === s.id) errors.push(`snacks/${s.id}: related lists itself`);
        else if (!ids.has(r.id)) errors.push(`snacks/${s.id}: unknown related snack "${r.id}" (no snacks/${r.id}/index.md)`);
      }
    }
    if (errors.length) throw new Error("Broken references:\n  " + errors.join("\n  "));

    return { snacks, makers };
  })());
}

// Related snacks in both directions: the ones this snack lists, plus any that list it.
export const relatedTo = (s: Snack, snacks: Snack[]) => {
  const ids = new Set(s.data.related.map((r) => r.id));
  for (const o of snacks) if (o.data.related.some((r) => r.id === s.id)) ids.add(o.id);
  return snacks.filter((o) => ids.has(o.id));
};

export const allCountries = (s: Snack) =>
  [...new Set([s.data.origin, ...s.data.available_in, ...s.data.aliases.flatMap((a) => a.countries)])];
