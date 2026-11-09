"use client";

import { GiftCard } from "@/components/wishlist/GiftCard";
import type { ViewerRole } from "@/components/wishlist/ReservationControl";
import type { PublicGift } from "@/lib/types";

type GiftGridProps = {
  label: string;
  gifts: PublicGift[];
  viewer: ViewerRole;
  loginHref: string;
  pendingId: PublicGift["id"] | null;
  onReserve: (giftId: PublicGift["id"]) => void;
  onCancel: (giftId: PublicGift["id"]) => void;
};

/**
 * Responsive grid of gift cards: 2 columns on phones, 3 from 1024px, 4 from 1280px.
 */
export function GiftGrid({
  label,
  gifts,
  viewer,
  loginHref,
  pendingId,
  onReserve,
  onCancel,
}: GiftGridProps) {
  return (
    <ul className="gift-grid" aria-label={label}>
      {gifts.map((gift) => (
        <li key={gift.id} className="flex min-w-0">
          <GiftCard
            gift={gift}
            viewer={viewer}
            loginHref={loginHref}
            pending={pendingId === gift.id}
            onReserve={onReserve}
            onCancel={onCancel}
          />
        </li>
      ))}
    </ul>
  );
}
