import { GiftPrice } from "@/components/wishlist/GiftPrice";
import { voice } from "@/content/voice";
import { safeHttpUrl } from "@/lib/safe-url";
import type { PublicGift } from "@/lib/types";
import { formatIndex } from "@/lib/wishlist-navigation";

type NavigatorStageProps = {
  gift: PublicGift;
  groupIndex: number;
  groupName: string;
  muted: boolean;
};

/**
 * Text column of the Naviguer view: category label, name, note, price and product link.
 */
export function NavigatorStage({ gift, groupIndex, groupName, muted }: NavigatorStageProps) {
  const productUrl = safeHttpUrl(gift.purchase_url);
  return (
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
      {productUrl ? (
        <a
          href={productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-link inline-flex min-h-11 items-center text-secondary"
        >
          {voice.list.product}
        </a>
      ) : null}
    </div>
  );
}
