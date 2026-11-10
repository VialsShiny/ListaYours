import { Gift } from "lucide-react";
import { GiftPrice } from "@/components/wishlist/GiftPrice";
import type { NavigatorMotion } from "@/hooks/use-gift-navigator";
import type { PublicGift } from "@/lib/types";
import { formatIndex } from "@/lib/wishlist-navigation";

type NavigatorStageProps = {
  gift: PublicGift;
  groupIndex: number;
  groupName: string;
  motion: NavigatorMotion;
  muted: boolean;
};

/**
 * The centred product image on its ground shadow, plus the text column: category label,
 * name, note, price and product link. The ghost word behind is decorative only.
 */
export function NavigatorStage({
  gift,
  groupIndex,
  groupName,
  motion,
  muted,
}: NavigatorStageProps) {
  return (
    <>
      <p aria-hidden="true" className="ghost-word navigator-ghost">
        {gift.name}
      </p>
      <div className="navigator-stage">
        <div className="navigator-image" data-motion={motion} key={String(gift.id)}>
          {gift.image_url ? (
            <img
              src={gift.image_url}
              alt=""
              decoding="async"
              referrerPolicy="no-referrer"
              style={muted ? { opacity: 0.45 } : undefined}
            />
          ) : (
            <Gift className="size-24 text-soft" strokeWidth={1} aria-hidden="true" />
          )}
        </div>
        <div className="navigator-ground" aria-hidden="true" />
      </div>
      <div className="navigator-info">
        <p className="index-tag text-[14px]">
          {formatIndex(groupIndex)} · {groupName}
        </p>
        <h2 className="navigator-title" id="navigator-titre">
          {gift.name}
        </h2>
        {gift.description ? (
          <p className="text-secondary line-clamp-3 text-soft">{gift.description}</p>
        ) : null}
        <GiftPrice
          price={gift.price}
          oldPrice={gift.old_price}
          currency={gift.currency}
          muted={muted}
          className="navigator-price"
        />
        {gift.purchase_url ? (
          <a
            href={gift.purchase_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link inline-flex min-h-11 items-center text-secondary"
          >
            Voir le produit →
          </a>
        ) : null}
      </div>
    </>
  );
}
