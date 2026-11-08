"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { PublicGift } from "@/lib/types";

export type ViewerRole = "anonymous" | "visitor" | "owner";

type ReservationControlProps = {
  gift: PublicGift;
  viewer: ViewerRole;
  loginHref: string;
  pending: boolean;
  onReserve: (giftId: PublicGift["id"]) => void;
  onCancel: (giftId: PublicGift["id"]) => void;
};

/**
 * Reservation action for one gift card, depending on who is looking.
 * Owners never get a control: they must not learn what is reserved.
 */
export function ReservationControl({
  gift,
  viewer,
  loginHref,
  pending,
  onReserve,
  onCancel,
}: ReservationControlProps) {
  if (viewer === "owner") return null;

  if (viewer === "anonymous") {
    return (
      <Link href={loginHref} className="link-arrow micro text-ink">
        Se connecter pour réserver
      </Link>
    );
  }

  if (gift.reserved_by_me) {
    return (
      <Button variant="outline" block disabled={pending} onClick={() => onCancel(gift.id)}>
        {pending ? "Annulation…" : "Annuler ma réservation"}
      </Button>
    );
  }

  if (gift.is_reserved) {
    return (
      <p className="micro border border-ink/40 px-5 py-3 text-center text-ink" role="status">
        Réservé
      </p>
    );
  }

  return (
    <Button variant="primary" block disabled={pending} onClick={() => onReserve(gift.id)}>
      {pending ? "Réservation…" : "Réserver"}
    </Button>
  );
}
