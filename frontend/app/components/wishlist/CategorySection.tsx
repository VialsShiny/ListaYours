"use client";

import { GiftGrid } from "@/components/wishlist/GiftGrid";
import type { ViewerRole } from "@/components/wishlist/ReservationControl";
import { formatIndex } from "@/lib/wishlist-navigation";
import type { GiftGroup } from "@/lib/wishlist-groups";
import type { PublicGift } from "@/lib/types";

type CategorySectionProps = {
  group: GiftGroup<PublicGift>;
  index: number;
  viewer: ViewerRole;
  loginHref: string;
  pendingId: PublicGift["id"] | null;
  onReserve: (giftId: PublicGift["id"]) => void;
  onCancel: (giftId: PublicGift["id"]) => void;
};

/**
 * One category of the grid view: accent index tag, display title and count above a hairline.
 */
export function CategorySection({
  group,
  index,
  viewer,
  loginHref,
  pendingId,
  onReserve,
  onCancel,
}: CategorySectionProps) {
  const headingId = `${group.anchor}-titre`;
  const count = group.gifts.length;
  return (
    <section id={group.anchor} aria-labelledby={headingId} className="scroll-mt-28 pt-10 md:pt-14">
      <div className="hairline mb-5 flex flex-wrap items-baseline justify-between gap-3 pt-5 md:mb-7 md:pt-6">
        <div className="flex min-w-0 items-baseline gap-2.5 md:gap-4">
          <span className="index-tag">{formatIndex(index)}</span>
          <h2 id={headingId} className="display display-section min-w-0">
            {group.name}
          </h2>
        </div>
        <p className="text-secondary text-soft">
          {count} {count > 1 ? "cadeaux" : "cadeau"}
        </p>
      </div>
      <GiftGrid
        label={`Cadeaux de la catégorie ${group.name}`}
        gifts={group.gifts}
        viewer={viewer}
        loginHref={loginHref}
        pendingId={pendingId}
        onReserve={onReserve}
        onCancel={onCancel}
      />
    </section>
  );
}
