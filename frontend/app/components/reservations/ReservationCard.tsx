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
 * Reservation card: the gift is already yours to offer.
 */
export function ReservationCard({ item, pending, onCancel }: ReservationCardProps) {
  const { gift, wishlist, reservation } = item;
  return (
    <article className="panel flex w-full flex-col gap-4 p-4 sm:flex-row sm:p-5">
      <div className="w-full overflow-hidden rounded-control sm:w-40 sm:shrink-0">
        <GiftPhoto src={gift.image_url} alt={gift.name} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <Link href={`/l/${wishlist.slug}`} className="badge self-start no-underline">
          {wishlist.title}
        </Link>
        <h2 className="title-card">{gift.name}</h2>
        <GiftPrice price={gift.price} oldPrice={gift.old_price} currency={gift.currency} />
        {reservation.created_at ? (
          <p className="text-footnote text-ink-soft">
            Réservé le {formatDate(reservation.created_at)}
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-4 border-t border-line pt-4">
          {gift.purchase_url ? (
            <a
              href={gift.purchase_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link text-subhead"
            >
              Voir le produit ↗
            </a>
          ) : null}
          <Button variant="secondary" disabled={pending} onClick={() => onCancel(gift.id)}>
            {pending ? "Annulation…" : "Annuler ma réservation"}
          </Button>
        </div>
      </div>
    </article>
  );
}
