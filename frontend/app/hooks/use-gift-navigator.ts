"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PublicGift } from "@/lib/types";
import type { GiftGroup } from "@/lib/wishlist-groups";
import {
  firstIndexOfGroup,
  flattenGroups,
  shouldIgnoreKey,
  stepIndex,
} from "@/lib/wishlist-navigation";

export type NavigatorMotion = "pointer" | "keyboard";

/**
 * One-gift-at-a-time navigation over the grouped list. The current gift is tracked by id, so a
 * refetch that reorders gifts keeps the viewer on the same gift. Previous/next never wrap around,
 * and Left/Right arrow keys on the document move too. Keyboard moves are flagged so the carousel
 * jumps instead of animating.
 */
export function useGiftNavigator(groups: GiftGroup<PublicGift>[]) {
  const flat = useMemo(() => flattenGroups(groups), [groups]);
  const total = flat.length;
  const [currentId, setCurrentId] = useState<PublicGift["id"] | null>(null);
  const [motion, setMotion] = useState<NavigatorMotion>("pointer");
  const found = flat.findIndex((item) => item.gift.id === currentId);
  const safeIndex = found >= 0 ? found : 0;
  const current = flat[safeIndex] ?? null;

  const goToIndex = useCallback(
    (next: number, source: NavigatorMotion = "pointer") => {
      const target = flat[next];
      if (!target) return;
      setMotion(source);
      setCurrentId(target.gift.id);
    },
    [flat],
  );

  const previous = useCallback(
    (source: NavigatorMotion = "pointer") => goToIndex(stepIndex(safeIndex, -1, total), source),
    [goToIndex, safeIndex, total],
  );

  const next = useCallback(
    (source: NavigatorMotion = "pointer") => goToIndex(stepIndex(safeIndex, 1, total), source),
    [goToIndex, safeIndex, total],
  );

  const goToGift = useCallback(
    (giftId: PublicGift["id"]) => {
      const position = flat.findIndex((item) => item.gift.id === giftId);
      if (position >= 0) goToIndex(position);
    },
    [flat, goToIndex],
  );

  const goToGroup = useCallback(
    (groupKey: string) => {
      const position = firstIndexOfGroup(flat, groupKey);
      if (position >= 0) goToIndex(position);
    },
    [flat, goToIndex],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (shouldIgnoreKey(event.target)) return;
      event.preventDefault();
      if (event.key === "ArrowLeft") previous("keyboard");
      else next("keyboard");
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [previous, next]);

  return {
    flat,
    total,
    index: safeIndex,
    current,
    motion,
    isFirst: safeIndex === 0,
    isLast: safeIndex >= total - 1,
    previous,
    next,
    goToIndex,
    goToGift,
    goToGroup,
  };
}
