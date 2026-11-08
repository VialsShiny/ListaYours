type Id = number | string;

/**
 * Returns the ids of `items` (already in display order) with `a` and `b` swapped.
 * Used for `PUT /reorder` endpoints that expect the full ordered id list.
 */
export function swapIds<T extends { id: Id }>(items: T[], a: Id, b: Id): Id[] {
  const ids = items.map((item) => item.id);
  const indexA = ids.findIndex((id) => String(id) === String(a));
  const indexB = ids.findIndex((id) => String(id) === String(b));
  if (indexA === -1 || indexB === -1 || indexA === indexB) return ids;
  [ids[indexA], ids[indexB]] = [ids[indexB], ids[indexA]];
  return ids;
}

/**
 * Sorts by `position`, then by id for stability.
 */
export function sortByPosition<T extends { id: Id; position: number }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => a.position - b.position || String(a.id).localeCompare(String(b.id)),
  );
}
