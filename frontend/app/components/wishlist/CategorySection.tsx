"use client";

import { GiftCarousel } from "@/components/wishlist/GiftCarousel";
import type { ViewerRole } from "@/components/wishlist/ReservationControl";
import type { GiftGroup } from "@/lib/wishlist-groups";
import type { PublicGift } from "@/lib/types";
import { cn } from "@/lib/utils";

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
 * One category = one section alternating white / light-grey bands, with its carousel.
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
  return (
    <section
      id={group.anchor}
      aria-labelledby={headingId}
      className={cn(
        "scroll-mt-6 px-4 py-12 md:px-12 md:py-16 lg:px-16",
        index % 2 === 0 ? "bg-white" : "bg-surface-alt",
      )}
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="micro mb-3 text-ink-soft">
            {String(index + 1).padStart(2, "0")} — {group.gifts.length}{" "}
            {group.gifts.length > 1 ? "cadeaux" : "cadeau"}
          </p>
          <h2 id={headingId} className="display display-section">
            {group.name}.
          </h2>
        </div>
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
    </section>
  );
}
