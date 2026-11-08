"use client";

import { useCallback } from "react";
import { useAsync } from "@/hooks/use-async";
import { useAuth } from "@/hooks/use-auth";
import { fetchPublicWishlist, fetchPublicWishlists } from "@/lib/api-public";
import type { PublicGift } from "@/lib/types";

export function usePublicWishlists() {
  return useAsync((signal) => fetchPublicWishlists(signal), "public-wishlists");
}

/**
 * Loads a public wishlist once the session is known, so the Bearer token is sent when present.
 */
export function usePublicWishlist(slug: string) {
  const { status, token } = useAuth();
  const ready = status !== "loading";
  const state = useAsync(
    (signal) => fetchPublicWishlist(slug, token, signal),
    `${slug}:${token ?? "anon"}`,
    ready,
  );

  const patchGift = useCallback(
    (giftId: PublicGift["id"], patch: Partial<PublicGift>) => {
      state.setData((current) =>
        current
          ? {
              ...current,
              gifts: current.gifts.map((gift) =>
                gift.id === giftId ? { ...gift, ...patch } : gift,
              ),
            }
          : current,
      );
    },
    [state],
  );

  return { ...state, loading: state.loading || !ready, patchGift };
}
