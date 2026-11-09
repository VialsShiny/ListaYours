import { PageHero } from "@/components/layout/PageHero";
import type { WishlistSummary } from "@/lib/types";

type WishlistHeaderProps = {
  wishlist: WishlistSummary;
  anchors: Array<{ anchor: string; name: string }>;
  giftCount: number;
};

/**
 * Gradient hero with the ultra-wide wishlist title and one pill per category.
 */
export function WishlistHeader({ wishlist, anchors, giftCount }: WishlistHeaderProps) {
  const countLabel = `${giftCount} ${giftCount > 1 ? "cadeaux" : "cadeau"}`;
  return (
    <PageHero eyebrow={`Liste de souhaits · ${countLabel}`} title={wishlist.title} size="hero">
      {wishlist.description ? <p className="text-headline mt-6">{wishlist.description}</p> : null}
      {anchors.length > 0 ? (
        <nav aria-label="Catégories" className="mt-8 flex flex-wrap gap-2">
          {anchors.map((item) => (
            <a key={item.anchor} href={`#${item.anchor}`} className="badge min-h-11 px-4">
              {item.name}
            </a>
          ))}
        </nav>
      ) : null}
    </PageHero>
  );
}
