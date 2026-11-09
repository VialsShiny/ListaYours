import { formatPrice, hasDiscount } from "@/lib/format";
import { cn } from "@/lib/utils";

type GiftPriceProps = {
  price: string | number | null | undefined;
  oldPrice?: string | number | null;
  currency?: string | null;
  muted?: boolean;
  withNote?: boolean;
  className?: string;
};

/**
 * Price line. A reduced price turns accent, followed by the old price and a "Prix réduit" note.
 */
export function GiftPrice({
  price,
  oldPrice,
  currency,
  muted = false,
  withNote = true,
  className,
}: GiftPriceProps) {
  const discounted = hasDiscount(price, oldPrice);
  const current = formatPrice(price, currency) ?? "Prix non renseigné";
  return (
    <p className={cn("price flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span className={cn(discounted && !muted && "price-reduced", muted && "text-soft")}>
        {discounted ? <span className="sr-only">Prix actuel : </span> : null}
        {current}
      </span>
      {discounted ? (
        <s className="price-old text-small">
          <span className="sr-only">Ancien prix : </span>
          {formatPrice(oldPrice, currency)}
        </s>
      ) : null}
      {discounted && withNote ? (
        <span className="text-small font-semibold text-accent">Prix réduit</span>
      ) : null}
    </p>
  );
}
