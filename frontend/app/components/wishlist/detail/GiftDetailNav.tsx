import Link from "next/link";
import { voice } from "@/content/voice";
import { detailHref } from "@/lib/gift-detail";
import type { PublicGift } from "@/lib/types";
import type { FlatGift } from "@/lib/wishlist-navigation";

type GiftDetailNavProps = {
  items: FlatGift<PublicGift>[];
  currentId: PublicGift["id"];
  slug: string;
  view: string;
};

/**
 * Top mini-nav: the neighbouring gifts of the same category by name, the current one filled.
 * Scrolls sideways on narrow screens instead of wrapping.
 */
export function GiftDetailNav({ items, currentId, slug, view }: GiftDetailNavProps) {
  if (items.length < 2) return null;
  return (
    <nav aria-label={voice.detail.siblings} className="gift-detail-nav" data-overflow-ok="">
      <ul>
        {items.map((item) => (
          <li key={item.gift.id}>
            <Link
              href={detailHref(slug, item.gift.id, view)}
              replace
              scroll={false}
              aria-current={item.gift.id === currentId ? "page" : undefined}
            >
              {item.gift.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
