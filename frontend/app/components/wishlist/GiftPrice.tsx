import { formatPrice, formatPriceLine, hasDiscount } from "@/lib/format";
import { cn } from "@/lib/utils";

type GiftPriceProps = {
  price: string | number | null | undefined;
  oldPrice?: string | number | null;
  currency?: string | null;
  className?: string;
};

/**
 * Price line; when the old price is higher it follows, struck through.
 */
export function GiftPrice({ price, oldPrice, currency, className }: GiftPriceProps) {
  const discounted = hasDiscount(price, oldPrice);
  if (!discounted) {
    return <p className={cn("price", className)}>{formatPriceLine(price, currency)}</p>;
  }
  return (
    <p className={cn("price flex flex-wrap items-baseline", className)}>
      <span>
        <span className="sr-only">Prix actuel : </span>
        {formatPrice(price, currency)}
      </span>
      <s className="price-old text-secondary font-medium">
        <span className="sr-only">Ancien prix : </span>
        {formatPrice(oldPrice, currency)}
      </s>
    </p>
  );
}
