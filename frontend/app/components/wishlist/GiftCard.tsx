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
 * Portrait card (280px) used in the public carousels. `data-reserved` desaturates the photo for
 * visitors only: owners never receive reservation data.
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
      aria-labelledby={titleId}
      data-reserved={reservedByOther ? "true" : undefined}
      className="card w-[280px]"
    >
      <GiftPhoto src={gift.image_url} alt={gift.name} reserved={reservedByOther} />
      <div className="card-body flex-1">
        <span className="badge self-start">{categoryName}</span>
        <h3 id={titleId} className="title-card">
          {gift.name}
        </h3>
        <GiftPrice price={gift.price} oldPrice={gift.old_price} currency={gift.currency} />
        {gift.description ? (
          <p className="text-subhead line-clamp-3 whitespace-pre-line text-ink-soft">
            {gift.description}
          </p>
        ) : (
          <p className="text-subhead text-ink-soft">Aucune précision.</p>
        )}
        <div className="mt-auto flex flex-col gap-3 pt-3">
          {gift.purchase_url ? (
            <a
              href={gift.purchase_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link text-subhead self-start"
            >
              Voir le produit ↗
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
      </div>
    </article>
  );
}
