"use client";

import { GiftCard } from "@/components/wishlist/GiftCard";
import type { ViewerRole } from "@/components/wishlist/ReservationControl";
import { cascadeStyle } from "@/lib/motion";
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
 * Responsive grid of gift cards (2 / 3 / 4 columns) entering in a 50ms cascade.
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
    <ul className="gift-grid cascade" aria-label={label}>
      {gifts.map((gift, index) => (
        <li key={gift.id} className="flex min-w-0" style={cascadeStyle(index)}>
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
