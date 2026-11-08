"use client";

import { GiftPhoto } from "@/components/wishlist/GiftPhoto";
import { GiftPrice } from "@/components/wishlist/GiftPrice";
import { ReservationControl, type ViewerRole } from "@/components/wishlist/ReservationControl";
import type { PublicGift } from "@/lib/types";

type GiftCardProps = {
  gift: PublicGift;
  categoryName: string;
  viewer: ViewerRole;
  loginHref: string;
  pending: boolean;
  onReserve: (giftId: PublicGift["id"]) => void;
  onCancel: (giftId: PublicGift["id"]) => void;
};

/**
 * Tall portrait card (~280px) used in the public carousels. Focusable so keyboard users
 * reveal the colour photo and can scroll the carousel with the arrow keys.
 */
export function GiftCard({
  gift,
  categoryName,
  viewer,
  loginHref,
  pending,
  onReserve,
  onCancel,
}: GiftCardProps) {
  const reservedByOther = viewer !== "owner" && gift.is_reserved && !gift.reserved_by_me;
  const titleId = `gift-${gift.id}-title`;

  return (
    <article
      tabIndex={0}
      aria-labelledby={titleId}
      className="gift-card flex w-[280px] flex-col gap-3 bg-white p-4 shadow-soft outline-offset-4"
    >
      <p className="micro text-ink-soft">{categoryName}</p>
      <GiftPhoto src={gift.image_url} alt={gift.name} reserved={reservedByOther} />
      <h3 id={titleId} className="display text-xl leading-tight">
        {gift.name}
      </h3>
      <GiftPrice price={gift.price} oldPrice={gift.old_price} currency={gift.currency} />
      <div className="hairline" />
      {gift.description ? (
        <p className="line-clamp-3 text-sm leading-relaxed text-ink-soft">{gift.description}</p>
      ) : (
        <p className="text-sm text-ink-soft">Aucune précision.</p>
      )}
      <div className="mt-auto flex flex-col gap-3 pt-2">
        {gift.purchase_url ? (
          <a
            href={gift.purchase_url}
            target="_blank"
            rel="noopener noreferrer"
            className="link-arrow micro self-start text-ink"
          >
            Voir le produit
          </a>
        ) : null}
        <ReservationControl
          gift={gift}
          viewer={viewer}
          loginHref={loginHref}
          pending={pending}
          onReserve={onReserve}
          onCancel={onCancel}
        />
      </div>
    </article>
  );
}
