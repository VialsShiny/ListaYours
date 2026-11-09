import type { GiftGroup } from "@/lib/wishlist-groups";

export type FlatGift<G> = { gift: G; groupIndex: number; groupKey: string; groupName: string };

/**
 * Formats a 0-based index as "#01".
 */
export function formatIndex(index: number): string {
  return `#${String(index + 1).padStart(2, "0")}`;
}

/**
 * Formats a 0-based position as "01" for the "01 / 23" counter.
 */
export function formatPosition(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/**
 * Flattens the grouped gifts in reading order, remembering each gift's category.
 */
export function flattenGroups<G>(groups: GiftGroup<G>[]): FlatGift<G>[] {
  return groups.flatMap((group, groupIndex) =>
    group.gifts.map((gift) => ({ gift, groupIndex, groupKey: group.key, groupName: group.name })),
  );
}

/**
 * Moves one step without wrapping around; the edges are sticky.
 */
export function stepIndex(current: number, delta: -1 | 1, total: number): number {
  if (total <= 0) return 0;
  return Math.min(total - 1, Math.max(0, current + delta));
}

/**
 * Position (0-based) of the first gift of a category in the flat list, or -1.
 */
export function firstIndexOfGroup<G>(flat: FlatGift<G>[], groupKey: string): number {
  return flat.findIndex((item) => item.groupKey === groupKey);
}

/**
 * True when a keyboard event should be left alone: typing in a field or inside a dialog.
 */
export function shouldIgnoreKey(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest("input, textarea, select, [contenteditable], [role='dialog']")) return true;
  return false;
}
