import { formatPrice, formatPriceLine, hasDiscount } from "@/lib/format";

type GiftPriceProps = {
  price: string | number | null | undefined;
  oldPrice?: string | number | null;
  currency?: string | null;
  className?: string;
};

/**
 * "— 199,00 €" line; when the old price is higher it is struck through and the
 * current price switches to the sale colour (the only non-grey tone of the brand).
 */
export function GiftPrice({ price, oldPrice, currency, className }: GiftPriceProps) {
  const discounted = hasDiscount(price, oldPrice);
  if (!discounted) {
    return (
      <p className={`text-sm font-medium text-ink ${className ?? ""}`}>
        {formatPriceLine(price, currency)}
      </p>
    );
  }
  return (
    <p className={`flex flex-wrap items-baseline gap-x-2 text-sm font-medium ${className ?? ""}`}>
      <span aria-hidden="true">—</span>
      <s className="text-ink-soft">
        <span className="sr-only">Ancien prix : </span>
        {formatPrice(oldPrice, currency)}
      </s>
      <span className="text-sale">
        <span className="sr-only">Prix actuel : </span>
        {formatPrice(price, currency)}
      </span>
    </p>
  );
}
