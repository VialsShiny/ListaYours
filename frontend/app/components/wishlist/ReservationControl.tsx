"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SwapLabel } from "@/components/ui/swap-label";
import type { PublicGift } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ViewerRole = "anonymous" | "visitor" | "owner";

type ReservationControlProps = {
  gift: PublicGift;
  viewer: ViewerRole;
  loginHref: string;
  pending: boolean;
  onReserve: (giftId: PublicGift["id"]) => void;
  onCancel: (giftId: PublicGift["id"]) => void;
  compact?: boolean;
  className?: string;
};

/**
 * Reservation action for one gift, depending on who is looking. The label crossfades between
 * states on a fixed-width button. Owners never get a control: they must not learn what is reserved.
 */
export function ReservationControl({
  gift,
  viewer,
  loginHref,
  pending,
  onReserve,
  onCancel,
  compact = false,
  className,
}: ReservationControlProps) {
  if (viewer === "owner") return null;

  if (viewer === "anonymous" && !gift.is_reserved) {
    return (
      <Link href={loginHref} className={cn("btn btn-primary btn-state w-full", className)}>
        Réserver
      </Link>
    );
  }

  if (viewer === "visitor" && gift.reserved_by_me) {
    return (
      <div className={cn("flex w-full flex-col items-center gap-2", className)}>
        <Button
          variant="secondary"
          block
          className="btn-state"
          disabled={pending}
          onClick={() => onCancel(gift.id)}
        >
          <SwapLabel
            label={pending ? "Annulation…" : compact ? "Annuler" : "Annuler ma réservation"}
          />
        </Button>
        <p className="text-small font-semibold text-accent" role="status">
          Réservé par vous
        </p>
      </div>
    );
  }

  if (gift.is_reserved) {
    return (
      <p className={cn("btn btn-muted btn-state w-full", className)} role="status">
        Déjà réservé
      </p>
    );
  }

  return (
    <Button
      variant="primary"
      block
      disabled={pending}
      onClick={() => onReserve(gift.id)}
      className={cn("btn-state", className)}
    >
      <SwapLabel label={pending ? "Réservation…" : "Réserver"} />
    </Button>
  );
}
