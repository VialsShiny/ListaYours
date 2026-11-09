"use client";

import { GiftCarousel } from "@/components/wishlist/GiftCarousel";
import type { ViewerRole } from "@/components/wishlist/ReservationControl";
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
 * One category = one numbered section ("#01") with its carousel.
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
    <section id={group.anchor} aria-labelledby={headingId} className="scroll-mt-24 pt-12 md:pt-16">
      <div className="container">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="index-tag">{String(index + 1).padStart(2, "0")}</p>
            <h2 id={headingId} className="title-section mt-2">
              {group.name}
            </h2>
          </div>
          <p className="eyebrow">
            {count} {count > 1 ? "cadeaux" : "cadeau"}
          </p>
        </div>
        <GiftCarousel
          label={`Cadeaux de la catégorie ${group.name}`}
          gifts={group.gifts}
          categoryName={group.name}
          viewer={viewer}
          loginHref={loginHref}
          pendingId={pendingId}
          onReserve={onReserve}
          onCancel={onCancel}
        />
      </div>
    </section>
  );
}
