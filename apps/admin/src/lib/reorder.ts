/**
 * Returns `ids` with `id` swapped one step up or down, or null when it can't move (not found,
 * already first/last). Callers then write each row's index as its new sortOrder, which also
 * repairs gaps or duplicates left by older rows.
 */
export const moveInList = (ids: string[], id: string, direction: "up" | "down"): string[] | null => {
  const from = ids.indexOf(id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= ids.length) return null;

  const next = [...ids];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
};
