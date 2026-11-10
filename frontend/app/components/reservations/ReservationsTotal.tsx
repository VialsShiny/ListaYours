"use client";

import { useCountUp } from "@/hooks/use-count-up";
import { voice } from "@/content/voice";
import { formatPrice } from "@/lib/format";

type ReservationsTotalProps = { amount: number; currency: string };

/**
 * "Total estimé" that counts up to its value (900ms ease-out, tabular digits). Screen readers
 * get the final amount only.
 */
export function ReservationsTotal({ amount, currency }: ReservationsTotalProps) {
  const shown = useCountUp(amount);
  return (
    <p className="flex flex-col items-end gap-1">
      <span className="text-small text-soft">{voice.reservations.total}</span>
      <span className="sr-only">{formatPrice(amount, currency)}</span>
      <span
        className="display text-[26px] tracking-[-0.03em] tabular-nums md:text-[40px]"
        aria-hidden="true"
      >
        {formatPrice(shown, currency)}
      </span>
    </p>
  );
}
