import { PageHero } from "@/components/layout/PageHero";
import { voice } from "@/content/voice";
import { ViewSwitch } from "@/components/wishlist/ViewSwitch";
import type { ViewMode } from "@/hooks/use-view-mode";
import type { WishlistSummary } from "@/lib/types";

type WishlistHeaderProps = {
  wishlist: WishlistSummary;
  giftCount: number;
  view: ViewMode;
  hrefFor: (mode: ViewMode) => string;
  onSelect: (mode: ViewMode) => void;
};

/**
 * Eyebrow, huge list title with the accent period, and the Naviguer / Grille switch.
 */
export function WishlistHeader({
  wishlist,
  giftCount,
  view,
  hrefFor,
  onSelect,
}: WishlistHeaderProps) {
  return (
    <PageHero
      eyebrow={voice.list.eyebrow(giftCount)}
      title={wishlist.title}
      titleId="liste-titre"
      userContent
      aside={
        <>
          <ViewSwitch
            view={view}
            hrefFor={hrefFor}
            onSelect={onSelect}
            className="w-full md:w-auto"
          />
          <p className="text-[14px] text-soft max-md:hidden">{voice.list.viewHelp}</p>
        </>
      }
    >
      {wishlist.description ? (
        <p className="text-lead mt-6 max-w-[46ch] text-soft">{wishlist.description}</p>
      ) : null}
    </PageHero>
  );
}
