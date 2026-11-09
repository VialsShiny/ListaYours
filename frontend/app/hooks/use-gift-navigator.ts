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
 * One-gift-at-a-time navigation over the grouped list: current index, previous/next without
 * wrap-around, jump to a gift or a category, and Left/Right arrow keys on the document.
 * Keyboard moves are flagged so the view can skip animation for them.
 */
export function useGiftNavigator(groups: GiftGroup<PublicGift>[]) {
  const flat = useMemo(() => flattenGroups(groups), [groups]);
  const total = flat.length;
  const [index, setIndex] = useState(0);
  const [motion, setMotion] = useState<NavigatorMotion>("pointer");
  const safeIndex = Math.min(index, Math.max(0, total - 1));
  const current = flat[safeIndex] ?? null;

  const go = useCallback((next: number, source: NavigatorMotion = "pointer") => {
    setMotion(source);
    setIndex(next);
  }, []);

  const previous = useCallback(
    (source: NavigatorMotion = "pointer") => go(stepIndex(safeIndex, -1, total), source),
    [go, safeIndex, total],
  );

  const next = useCallback(
    (source: NavigatorMotion = "pointer") => go(stepIndex(safeIndex, 1, total), source),
    [go, safeIndex, total],
  );

  const goToGift = useCallback(
    (giftId: PublicGift["id"]) => {
      const position = flat.findIndex((item) => item.gift.id === giftId);
      if (position >= 0) go(position);
    },
    [flat, go],
  );

  const goToGroup = useCallback(
    (groupKey: string) => {
      const position = firstIndexOfGroup(flat, groupKey);
      if (position >= 0) go(position);
    },
    [flat, go],
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
    goToGift,
    goToGroup,
  };
}
