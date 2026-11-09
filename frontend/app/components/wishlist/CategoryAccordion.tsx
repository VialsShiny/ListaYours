"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ViewerRole } from "@/components/wishlist/ReservationControl";
import { formatPrice } from "@/lib/format";
import type { PublicGift } from "@/lib/types";
import type { GiftGroup } from "@/lib/wishlist-groups";
import { formatIndex } from "@/lib/wishlist-navigation";

type CategoryAccordionProps = {
  groups: GiftGroup<PublicGift>[];
  currentGiftId: PublicGift["id"] | null;
  currentGroupKey: string | null;
  viewer: ViewerRole;
  onSelectGift: (giftId: PublicGift["id"]) => void;
};

/**
 * Category list with one open section at a time. The open category lists its gifts, the current
 * one highlighted. Visitors see "Réservé" instead of a reserved gift's price; the owner never does.
 */
export function CategoryAccordion({
  groups,
  currentGiftId,
  currentGroupKey,
  viewer,
  onSelectGift,
}: CategoryAccordionProps) {
  const [openKey, setOpenKey] = useState<string | null>(currentGroupKey);

  useEffect(() => {
    setOpenKey(currentGroupKey);
  }, [currentGroupKey]);

  return (
    <div className="flex flex-col">
      {groups.map((group, index) => {
        const open = openKey === group.key;
        const panelId = `accordion-${group.key}`;
        return (
          <div key={group.key} className="border-b border-line last:border-b-0">
            <button
              type="button"
              className="accordion-row"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenKey(open ? null : group.key)}
            >
              <span className="min-w-0">
                <span className="index-tag mr-2 text-small">{formatIndex(index)}</span>
                <span className={open ? "font-semibold" : "font-normal"}>{group.name}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2.5 text-[14px] text-soft">
                {group.gifts.length}
                {open ? (
                  <ChevronDown className="size-[18px]" aria-hidden="true" />
                ) : (
                  <ChevronRight className="size-[18px]" aria-hidden="true" />
                )}
              </span>
            </button>
            {open ? (
              <ul id={panelId} className="flex flex-col gap-0.5 pb-2.5">
                {group.gifts.map((gift) => {
                  const reserved = viewer !== "owner" && gift.is_reserved;
                  const isCurrent = gift.id === currentGiftId;
                  return (
                    <li key={gift.id}>
                      <button
                        type="button"
                        className="accordion-item"
                        aria-current={isCurrent ? "true" : undefined}
                        onClick={() => onSelectGift(gift.id)}
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <span className="accordion-dot" aria-hidden="true" />
                          <span className="truncate">{gift.name}</span>
                        </span>
                        <span className="shrink-0">
                          {reserved ? "Réservé" : (formatPrice(gift.price, gift.currency) ?? "—")}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
