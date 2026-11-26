"use client";

import { useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import { Gift } from "lucide-react";
import type { NavigatorMotion } from "@/hooks/use-gift-navigator";
import { prefersReducedMotion, shouldMove } from "@/lib/motion";
import { safeHttpUrl } from "@/lib/safe-url";
import type { PublicGift } from "@/lib/types";
import type { FlatGift } from "@/lib/wishlist-navigation";
import type { ViewerRole } from "@/components/wishlist/ReservationControl";

type NavigatorCarouselProps = {
  items: FlatGift<PublicGift>[];
  index: number;
  motion: NavigatorMotion;
  viewer: ViewerRole;
  onSelect: (index: number) => void;
  detailHref?: (giftId: PublicGift["id"]) => string;
};

/**
 * Embla carousel: one gift centred, neighbours at 90% and half opacity, drag with snapping.
 * The index is owned by the navigator hook; keyboard and reduced-motion moves jump instantly.
 * The centred slide links to the gift page when `detailHref` is given.
 */
export function NavigatorCarousel({
  items,
  index,
  motion,
  viewer,
  onSelect,
  detailHref,
}: NavigatorCarouselProps) {
  const [viewportRef, api] = useEmblaCarousel({
    align: "center",
    containScroll: false,
    skipSnaps: false,
    duration: prefersReducedMotion() ? 0 : 22,
  });
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!api) return;
    const handle = () => onSelectRef.current(api.selectedScrollSnap());
    api.on("select", handle);
    return () => {
      api.off("select", handle);
    };
  }, [api]);

  useEffect(() => {
    if (!api || api.selectedScrollSnap() === index) return;
    const jump = !shouldMove(prefersReducedMotion(), motion);
    api.scrollTo(index, jump);
  }, [api, index, motion]);

  return (
    <div
      ref={viewportRef}
      className="navigator-viewport"
      data-overflow-ok=""
      role="group"
      aria-roledescription="carrousel"
      aria-label="Cadeaux"
    >
      <ul className="navigator-track">
        {items.map((item, position) => {
          const muted = viewer !== "owner" && item.gift.is_reserved && !item.gift.reserved_by_me;
          const imageUrl = safeHttpUrl(item.gift.image_url);
          const href = position === index ? detailHref?.(item.gift.id) : undefined;
          const media = imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              decoding="async"
              loading={Math.abs(position - index) > 1 ? "lazy" : undefined}
              referrerPolicy="no-referrer"
              draggable={false}
            />
          ) : (
            <Gift className="size-24 text-soft" strokeWidth={1} aria-hidden="true" />
          );
          return (
            <li
              key={item.gift.id}
              className="navigator-slide"
              data-active={position === index ? "true" : undefined}
              aria-hidden={position === index ? undefined : "true"}
            >
              <div className="navigator-image" data-muted={muted ? "true" : undefined}>
                {href ? (
                  <Link href={href} aria-label={item.gift.name} draggable={false}>
                    {media}
                  </Link>
                ) : (
                  media
                )}
              </div>
              <div className="navigator-ground" aria-hidden="true" />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
