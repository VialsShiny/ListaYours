import type { Category } from "@/lib/types";

type Positioned = { id: number | string; category_id: number | string | null; position: number };

export type GiftGroup<G> = {
  key: string;
  anchor: string;
  name: string;
  gifts: G[];
};

export const OTHERS_GROUP_NAME = "Autres";

/**
 * Builds a URL-safe anchor from a category name ("Déco & lumière" -> "deco-lumiere").
 */
export function slugifyAnchor(name: string, fallback = "categorie"): string {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function byPosition<T extends { position: number }>(a: T, b: T): number {
  return a.position - b.position;
}

/**
 * Groups gifts under their category, ordered by category then gift position.
 * Gifts without a (known) category land in a final "Autres" group, only when any exist.
 * Empty categories are kept so the owner sees them, unless `dropEmpty` is set.
 */
export function groupGiftsByCategory<G extends Positioned>(
  categories: Category[],
  gifts: G[],
  options: { dropEmpty?: boolean } = {},
): GiftGroup<G>[] {
  const sortedCategories = [...categories].sort(byPosition);
  const knownIds = new Set(sortedCategories.map((category) => String(category.id)));
  const groups: GiftGroup<G>[] = sortedCategories.map((category, index) => ({
    key: String(category.id),
    anchor: `cat-${slugifyAnchor(category.name, `categorie-${index + 1}`)}`,
    name: category.name,
    gifts: [],
  }));
  const others: GiftGroup<G> = {
    key: "others",
    anchor: "cat-autres",
    name: OTHERS_GROUP_NAME,
    gifts: [],
  };

  for (const gift of [...gifts].sort(byPosition)) {
    const categoryKey = gift.category_id === null ? null : String(gift.category_id);
    const target =
      categoryKey !== null && knownIds.has(categoryKey)
        ? groups.find((group) => group.key === categoryKey)
        : undefined;
    (target ?? others).gifts.push(gift);
  }

  const result = options.dropEmpty ? groups.filter((group) => group.gifts.length > 0) : groups;
  return others.gifts.length > 0 ? [...result, others] : result;
}

/**
 * Moves the item at `index` one step in `direction` and returns the new ordered id list.
 * Returns `null` when the move is impossible (already at the edge).
 */
export function moveId<T extends { id: number | string }>(
  items: T[],
  index: number,
  direction: -1 | 1,
): Array<T["id"]> | null {
  const target = index + direction;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return null;
  const ids = items.map((item) => item.id);
  [ids[index], ids[target]] = [ids[target], ids[index]];
  return ids;
}
