"use client";

import { useEffect, useRef, useState } from "react";
import { voice } from "@/content/voice";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MicroLabel } from "@/components/layout/MicroLabel";
import { CategoryAccordion } from "@/components/wishlist/CategoryAccordion";
import { CategorySheet } from "@/components/wishlist/CategorySheet";
import { NavigatorBar } from "@/components/wishlist/NavigatorBar";
import { NavigatorCarousel } from "@/components/wishlist/NavigatorCarousel";
import { NavigatorStage } from "@/components/wishlist/NavigatorStage";
import { ReservationControl, type ViewerRole } from "@/components/wishlist/ReservationControl";
import { useGhostParallax } from "@/hooks/use-ghost-parallax";
import { useGiftNavigator } from "@/hooks/use-gift-navigator";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { PublicGift } from "@/lib/types";
import type { GiftGroup } from "@/lib/wishlist-groups";

type GiftNavigatorProps = {
  groups: GiftGroup<PublicGift>[];
  viewer: ViewerRole;
  loginHref: string;
  pendingId: PublicGift["id"] | null;
  onReserve: (giftId: PublicGift["id"]) => void;
  onCancel: (giftId: PublicGift["id"]) => void;
};

/**
 * "Naviguer" view: Embla carousel (one gift centred), text column, bottom bar, and the
 * desktop accordion panel or the mobile bottom sheet. The ghost word drifts with the mouse.
 */
export function GiftNavigator({
  groups,
  viewer,
  loginHref,
  pendingId,
  onReserve,
  onCancel,
}: GiftNavigatorProps) {
  const nav = useGiftNavigator(groups);
  const [sheetOpen, setSheetOpen] = useState(false);
  const desktop = useMediaQuery("(min-width: 1024px)");
  const sectionRef = useRef<HTMLElement | null>(null);
  useGhostParallax(sectionRef);

  useEffect(() => {
    if (desktop) setSheetOpen(false);
  }, [desktop]);

  if (!nav.current) return null;
  const { gift, groupIndex, groupKey, groupName } = nav.current;
  const muted = viewer !== "owner" && gift.is_reserved && !gift.reserved_by_me;
  const control = (compact: boolean, className: string) =>
    viewer === "owner" ? null : (
      <ReservationControl
        gift={gift}
        viewer={viewer}
        loginHref={loginHref}
        pending={pendingId === gift.id}
        onReserve={onReserve}
        onCancel={onCancel}
        compact={compact}
        className={className}
      />
    );

  return (
    <section ref={sectionRef} aria-labelledby="navigator-titre" className="container pt-6 md:pt-8">
      <div className="navigator" data-overflow-ok="">
        <p aria-hidden="true" className="ghost-word navigator-ghost">
          {gift.name}
        </p>
        <div className="navigator-main">
          <NavigatorStage gift={gift} groupIndex={groupIndex} groupName={groupName} muted={muted} />
          <NavigatorCarousel
            items={nav.flat}
            index={nav.index}
            motion={nav.motion}
            viewer={viewer}
            onSelect={(index) => {
              if (index !== nav.index) nav.goToIndex(index, "pointer");
            }}
          />
          <NavigatorBar
            index={nav.index}
            total={nav.total}
            isFirst={nav.isFirst}
            isLast={nav.isLast}
            onPrevious={() => nav.previous()}
            onNext={() => nav.next()}
            onShowCategory={() => nav.goToGroup(groupKey)}
            action={control(false, "w-auto min-w-44")}
          />
        </div>
        <aside
          className="navigator-panel material max-lg:hidden"
          aria-label={voice.list.categories}
        >
          <MicroLabel className="px-2 py-1">{voice.list.categories}</MicroLabel>
          <CategoryAccordion
            groups={groups}
            currentGiftId={gift.id}
            currentGroupKey={groupKey}
            viewer={viewer}
            onSelectGift={nav.goToGift}
          />
        </aside>
      </div>
      <div className="sticky-bar -mx-[16px] mt-6 flex gap-3 lg:hidden">
        <Button variant="secondary" className="flex-1" onClick={() => setSheetOpen(true)}>
          {voice.list.categories}
          <ChevronUp className="size-4" aria-hidden="true" />
        </Button>
        {control(true, "flex-[1.4]")}
      </div>
      <CategorySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        groups={groups}
        currentGiftId={gift.id}
        currentGroupKey={groupKey}
        viewer={viewer}
        onSelectGift={nav.goToGift}
      />
    </section>
  );
}
