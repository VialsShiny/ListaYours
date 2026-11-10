"use client";

import { GiftPhoto } from "@/components/wishlist/GiftPhoto";
import { voice } from "@/content/voice";
import { GiftPrice } from "@/components/wishlist/GiftPrice";
import { ReservationControl, type ViewerRole } from "@/components/wishlist/ReservationControl";
import { hasDiscount } from "@/lib/format";
import type { PublicGift } from "@/lib/types";

type GiftCardProps = {
  gift: PublicGift;
  viewer: ViewerRole;
  loginHref: string;
  pending: boolean;
  onReserve: (giftId: PublicGift["id"]) => void;
  onCancel: (giftId: PublicGift["id"]) => void;
};

/**
 * Grid card: square photo on a tile, name in the display font, price, note, product link,
 * then the reservation control. `data-reserved` is only ever set for non-owner viewers.
 */
export function GiftCard({ gift, viewer, loginHref, pending, onReserve, onCancel }: GiftCardProps) {
  const reservedByOther = viewer !== "owner" && gift.is_reserved && !gift.reserved_by_me;
  const titleId = `gift-${gift.id}-title`;

  return (
    <article
      aria-labelledby={titleId}
      data-reserved={reservedByOther ? "true" : undefined}
      className="card"
    >
      <GiftPhoto src={gift.image_url} alt={gift.name} />
      <div className="card-body flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 id={titleId} className="display-card line-clamp-3 min-w-0">
            {gift.name}
          </h3>
          <GiftPrice
            price={gift.price}
            oldPrice={gift.old_price}
            currency={gift.currency}
            muted={reservedByOther}
            withNote={false}
            className="shrink-0 text-[16px]"
          />
        </div>
        <div className="flex min-h-6 flex-wrap items-center gap-x-3 gap-y-1 text-small">
          {gift.description ? (
            <p className="line-clamp-2 min-w-0 text-soft">{gift.description}</p>
          ) : null}
          {hasDiscount(gift.price, gift.old_price) && !reservedByOther ? (
            <span className="font-semibold text-accent">{voice.list.reduced}</span>
          ) : null}
          {gift.purchase_url ? (
            <a
              href={gift.purchase_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link inline-flex min-h-11 items-center"
            >
              {voice.list.product}
            </a>
          ) : null}
        </div>
      </div>
      <ReservationControl
        gift={gift}
        viewer={viewer}
        loginHref={loginHref}
        pending={pending}
        onReserve={onReserve}
        onCancel={onCancel}
        compact
      />
    </article>
  );
}
