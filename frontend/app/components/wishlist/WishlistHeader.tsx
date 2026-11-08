import { DisplayTitle } from "@/components/layout/DisplayTitle";
import { MicroLabel } from "@/components/layout/MicroLabel";
import { CategoryRail } from "@/components/wishlist/CategoryRail";
import { GiftCounter } from "@/components/wishlist/GiftCounter";
import type { WishlistSummary } from "@/lib/types";

type WishlistHeaderProps = {
  wishlist: WishlistSummary;
  anchors: Array<{ anchor: string; name: string }>;
  giftCount: number;
};

/**
 * Editorial header: rotated category rail on the left, title in the middle,
 * huge rotated gift counter on the right. Decorations hide below 768px.
 */
export function WishlistHeader({ wishlist, anchors, giftCount }: WishlistHeaderProps) {
  return (
    <header className="relative overflow-hidden bg-surface px-4 pt-12 pb-16 md:px-12 md:pt-20 md:pb-24 lg:px-16">
      <div className="grid gap-8 md:grid-cols-[auto_1fr_auto] md:gap-12">
        <CategoryRail anchors={anchors} />
        <div className="min-w-0">
          <MicroLabel className="mb-6">Liste de souhaits</MicroLabel>
          <DisplayTitle size="hero" className="break-words">
            {wishlist.title}
          </DisplayTitle>
          {wishlist.description ? (
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink">{wishlist.description}</p>
          ) : null}
          {anchors.length > 0 ? (
            <nav aria-label="Catégories" className="mt-8 flex flex-wrap gap-x-5 gap-y-2 md:hidden">
              {anchors.map((item) => (
                <a key={item.anchor} href={`#${item.anchor}`} className="link-arrow micro text-ink">
                  {item.name}
                </a>
              ))}
            </nav>
          ) : null}
        </div>
        <GiftCounter count={giftCount} />
      </div>
    </header>
  );
}
