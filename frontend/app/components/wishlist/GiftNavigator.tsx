"use client";

import { useState } from "react";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MicroLabel } from "@/components/layout/MicroLabel";
import { CategoryAccordion } from "@/components/wishlist/CategoryAccordion";
import { CategorySheet } from "@/components/wishlist/CategorySheet";
import { NavigatorBar } from "@/components/wishlist/NavigatorBar";
import { NavigatorStage } from "@/components/wishlist/NavigatorStage";
import { ReservationControl, type ViewerRole } from "@/components/wishlist/ReservationControl";
import { useGiftNavigator } from "@/hooks/use-gift-navigator";
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
 * "Naviguer" view: one gift at a time with a desktop accordion panel or a mobile bottom sheet.
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
  if (!nav.current) return null;
  const { gift, groupIndex, groupKey, groupName } = nav.current;
  const muted = viewer !== "owner" && gift.is_reserved && !gift.reserved_by_me;
  const action = (
    <ReservationControl
      gift={gift}
      viewer={viewer}
      loginHref={loginHref}
      pending={pendingId === gift.id}
      onReserve={onReserve}
      onCancel={onCancel}
      className="w-auto min-w-44"
    />
  );

  return (
    <section aria-labelledby="navigator-titre" className="container pt-6 md:pt-8">
      <div className="navigator">
        <div className="navigator-main">
          <NavigatorStage
            gift={gift}
            groupIndex={groupIndex}
            groupName={groupName}
            motion={nav.motion}
            muted={muted}
          />
          <NavigatorBar
            index={nav.index}
            total={nav.total}
            isFirst={nav.isFirst}
            isLast={nav.isLast}
            onPrevious={() => nav.previous()}
            onNext={() => nav.next()}
            onShowCategory={() => nav.goToGroup(groupKey)}
            action={viewer === "owner" ? null : action}
          />
        </div>
        <aside className="navigator-panel material max-lg:hidden" aria-label="Catégories">
          <MicroLabel className="px-2 py-1">Catégories</MicroLabel>
          <CategoryAccordion
            groups={groups}
            currentGiftId={gift.id}
            currentGroupKey={groupKey}
            viewer={viewer}
            onSelectGift={nav.goToGift}
          />
        </aside>
      </div>
      <div className="sticky-bar -mx-4 mt-6 flex gap-3 lg:hidden">
        <Button variant="secondary" className="flex-1" onClick={() => setSheetOpen(true)}>
          Catégories
          <ChevronUp className="size-4" aria-hidden="true" />
        </Button>
        {viewer === "owner" ? null : (
          <ReservationControl
            gift={gift}
            viewer={viewer}
            loginHref={loginHref}
            pending={pendingId === gift.id}
            onReserve={onReserve}
            onCancel={onCancel}
            compact
            className="flex-[1.4]"
          />
        )}
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
