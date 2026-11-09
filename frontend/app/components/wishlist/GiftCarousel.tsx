"use client";

import { GiftCard } from "@/components/wishlist/GiftCard";
import { GiftCardSkeleton } from "@/components/wishlist/GiftCardSkeleton";
import { SlideButton } from "@/components/wishlist/SlideButton";
import type { ViewerRole } from "@/components/wishlist/ReservationControl";
import { useCarousel } from "@/hooks/use-carousel";
import type { PublicGift } from "@/lib/types";

type GiftCarouselProps = {
  label: string;
  gifts: PublicGift[];
  categoryName: string;
  viewer: ViewerRole;
  loginHref: string;
  pendingId: PublicGift["id"] | null;
  onReserve: (giftId: PublicGift["id"]) => void;
  onCancel: (giftId: PublicGift["id"]) => void;
};

export function GiftCarousel({
  label,
  gifts,
  categoryName,
  viewer,
  loginHref,
  pendingId,
  onReserve,
  onCancel,
}: GiftCarouselProps) {
  const { scrollerRef, slide } = useCarousel();

  return (
    <div className="flex flex-col gap-4">
      <ul ref={scrollerRef} className="scroller -mx-4 px-4" aria-label={label}>
        {gifts.map((gift) => (
          <li key={gift.id} className="flex">
            <GiftCard
              gift={gift}
              categoryName={categoryName}
              viewer={viewer}
              loginHref={loginHref}
              pending={pendingId === gift.id}
              onReserve={onReserve}
              onCancel={onCancel}
            />
          </li>
        ))}
      </ul>
      {gifts.length > 1 ? (
        <div className="flex justify-end">
          <SlideButton onClick={slide} label={`Faire défiler ${label}`} />
        </div>
      ) : null}
    </div>
  );
}

export function GiftCarouselSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className="scroller -mx-4 px-4" aria-busy="true" aria-label="Chargement des cadeaux">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="flex">
          <GiftCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
