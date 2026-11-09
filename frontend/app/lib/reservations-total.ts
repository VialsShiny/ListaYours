import { formatPrice, parsePrice } from "@/lib/format";
import type { MyReservation } from "@/lib/types";

/**
 * Sums the reserved gifts' prices (ignoring missing ones) and formats the estimate in the
 * first gift's currency. Returns `null` when no gift has a price.
 */
export function formatReservationsTotal(items: MyReservation[]): string | null {
  const priced = items.filter((item) => parsePrice(item.gift.price) !== null);
  if (priced.length === 0) return null;
  const total = priced.reduce((sum, item) => sum + (parsePrice(item.gift.price) ?? 0), 0);
  return formatPrice(total, priced[0].gift.currency);
}
