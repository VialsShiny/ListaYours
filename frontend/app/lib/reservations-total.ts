import { formatPrice, normalizeCurrency, parsePrice } from "@/lib/format";
import type { MyReservation } from "@/lib/types";

export type ReservationsTotal = { amount: number; currency: string };

/**
 * Sums the reserved gifts' prices (ignoring missing ones). Returns `null` when no gift has a
 * price or when the priced gifts mix currencies.
 */
export function sumReservations(items: MyReservation[]): ReservationsTotal | null {
  const priced = items.filter((item) => parsePrice(item.gift.price) !== null);
  if (priced.length === 0) return null;
  const currencies = new Set(priced.map((item) => normalizeCurrency(item.gift.currency)));
  if (currencies.size > 1) return null;
  const amount = priced.reduce((sum, item) => sum + (parsePrice(item.gift.price) ?? 0), 0);
  return { amount, currency: normalizeCurrency(priced[0].gift.currency) };
}

/**
 * Formatted estimate, kept for callers that only need the text.
 */
export function formatReservationsTotal(items: MyReservation[]): string | null {
  const total = sumReservations(items);
  return total ? formatPrice(total.amount, total.currency) : null;
}
