"use client";

import { X } from "lucide-react";
import { voice } from "@/content/voice";
import { Drawer, DrawerClose, DrawerContent } from "@/components/ui/drawer";
import { DisplayTitle } from "@/components/layout/DisplayTitle";
import { CategoryAccordion } from "@/components/wishlist/CategoryAccordion";
import type { ViewerRole } from "@/components/wishlist/ReservationControl";
import type { PublicGift } from "@/lib/types";
import type { GiftGroup } from "@/lib/wishlist-groups";

type CategorySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: GiftGroup<PublicGift>[];
  currentGiftId: PublicGift["id"] | null;
  currentGroupKey: string | null;
  viewer: ViewerRole;
  onSelectGift: (giftId: PublicGift["id"]) => void;
};

/**
 * Bottom sheet holding the category accordion on phones (drag handle, dim backdrop, Escape).
 */
export function CategorySheet({
  open,
  onOpenChange,
  groups,
  currentGiftId,
  currentGroupKey,
  viewer,
  onSelectGift,
}: CategorySheetProps) {
  return (
    <Drawer placement="bottom" open={open} onOpenChange={onOpenChange}>
      <DrawerContent aria-label={voice.list.categories}>
        <div className="flex items-center justify-between gap-3 px-4 pb-2">
          <DisplayTitle as="h2" size="sub">
            {voice.list.categories}
          </DisplayTitle>
          <DrawerClose className="btn btn-icon" aria-label={voice.list.closeCategories}>
            <X aria-hidden="true" />
          </DrawerClose>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <CategoryAccordion
            groups={groups}
            currentGiftId={currentGiftId}
            currentGroupKey={currentGroupKey}
            viewer={viewer}
            onSelectGift={(giftId) => {
              onSelectGift(giftId);
              onOpenChange(false);
            }}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
