"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GiftPhoto } from "@/components/wishlist/GiftPhoto";
import { GiftPrice } from "@/components/wishlist/GiftPrice";
import { formatDate } from "@/lib/format";
import type { MyReservation } from "@/lib/types";

type ReservationCardProps = {
  item: MyReservation;
  pending: boolean;
  onCancel: (giftId: MyReservation["gift"]["id"]) => void;
};

/**
 * Reservation card: photos stay in full colour here, the gift is already yours to offer.
 */
export function ReservationCard({ item, pending, onCancel }: ReservationCardProps) {
  const { gift, wishlist, reservation } = item;
  return (
    <article className="flex flex-col gap-4 bg-white p-4 shadow-soft sm:flex-row sm:p-5">
      <div className="w-full sm:w-40 sm:shrink-0">
        <GiftPhoto src={gift.image_url} alt={gift.name} restGrey={false} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <Link href={`/l/${wishlist.slug}`} className="link-arrow micro self-start text-ink-soft">
          {wishlist.title}
        </Link>
        <h2 className="display text-2xl leading-tight">{gift.name}</h2>
        <GiftPrice price={gift.price} oldPrice={gift.old_price} currency={gift.currency} />
        {reservation.created_at ? (
          <p className="text-xs text-ink-soft">Réservé le {formatDate(reservation.created_at)}</p>
        ) : null}
        <div className="hairline" />
        <div className="mt-auto flex flex-wrap items-center gap-4">
          {gift.purchase_url ? (
            <a
              href={gift.purchase_url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-arrow micro text-ink"
            >
              Voir le produit
            </a>
          ) : null}
          <Button variant="outline" disabled={pending} onClick={() => onCancel(gift.id)}>
            {pending ? "Annulation…" : "Annuler ma réservation"}
          </Button>
        </div>
      </div>
    </article>
  );
}
