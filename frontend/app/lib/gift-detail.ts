import type { FlatGift } from "@/lib/wishlist-navigation";

export type GiftPosition<G> = {
  index: number;
  previous: FlatGift<G> | null;
  next: FlatGift<G> | null;
};

/**
 * Finds a gift in the flat list by its URL segment. Previous and next never wrap: the edges are
 * sticky, like the Naviguer view.
 */
export function locateGift<G extends { id: number | string }>(
  flat: FlatGift<G>[],
  giftId: string,
): GiftPosition<G> | null {
  const index = flat.findIndex((item) => String(item.gift.id) === giftId);
  if (index < 0) return null;
  return { index, previous: flat[index - 1] ?? null, next: flat[index + 1] ?? null };
}

/**
 * The gifts of the same category around the current one, at most `size`, the window sliding so
 * that the current gift stays inside it.
 */
export function siblingWindow<G>(flat: FlatGift<G>[], index: number, size = 5): FlatGift<G>[] {
  const current = flat[index];
  if (!current) return [];
  const siblings = flat.filter((item) => item.groupKey === current.groupKey);
  const at = siblings.indexOf(current);
  const start = Math.max(0, Math.min(at - Math.floor(size / 2), siblings.length - size));
  return siblings.slice(start, start + size);
}

export function detailHref(slug: string, giftId: number | string, view: string): string {
  return `/l/${slug}/c/${giftId}?vue=${view}`;
}

export function listHref(slug: string, view: string): string {
  return `/l/${slug}?vue=${view}`;
}
