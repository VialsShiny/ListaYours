"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GiftPhoto } from "@/components/wishlist/GiftPhoto";
import { formatDate, formatPrice } from "@/lib/format";
import type { MyReservation } from "@/lib/types";

type ReservationCardProps = {
  item: MyReservation;
  pending: boolean;
  onCancel: (item: MyReservation) => void;
};

/**
 * Reservation row: photo, accent list label, name, price and date, product link, "Annuler".
 * On phones the photo and text sit on top and the actions take a full-width row below.
 */
export function ReservationCard({ item, pending, onCancel }: ReservationCardProps) {
  const { gift, wishlist, reservation } = item;
  const price = formatPrice(gift.price, gift.currency);
  const date = reservation.created_at ? formatDate(reservation.created_at) : "";
  return (
    <article className="panel flex w-full flex-col gap-4 p-4 md:flex-row md:items-center md:gap-6 md:p-5">
      <div className="flex min-w-0 flex-1 items-center gap-4 md:gap-6">
        <GiftPhoto
          src={gift.image_url}
          alt={gift.name}
          className="size-[84px] shrink-0 rounded-[14px] md:size-[120px] md:rounded-[16px]"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 md:gap-2">
          <Link
            href={`/l/${wishlist.slug}`}
            className="eyebrow eyebrow-accent text-micro inline-flex min-h-11 items-center self-start tracking-[0.1em]"
          >
            {wishlist.title}
          </Link>
          <h2 className="display-card text-[19px] leading-[1.15] md:text-[26px] md:tracking-[-0.02em]">
            {gift.name}
          </h2>
          <p className="text-secondary text-soft">
            {price ?? "Prix non renseigné"}
            {date ? ` · Réservé le ${date}` : ""}
          </p>
        </div>
      </div>
      <div className="flex gap-2.5 md:shrink-0 md:items-center md:gap-3">
        {gift.purchase_url ? (
          <a
            href={gift.purchase_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link text-secondary inline-flex min-h-12 flex-1 items-center justify-center md:flex-none md:pr-3"
          >
            Voir le produit →
          </a>
        ) : null}
        <Button
          variant="secondary"
          size="sm"
          className="min-h-12 flex-1 md:flex-none"
          disabled={pending}
          onClick={() => onCancel(item)}
        >
          {pending ? "Annulation…" : "Annuler"}
        </Button>
      </div>
    </article>
  );
}
