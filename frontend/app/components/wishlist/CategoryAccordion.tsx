"use client";

import { useEffect, useState } from "react";
import { voice } from "@/content/voice";
import { Accordion } from "@base-ui/react/accordion";
import { ChevronRight } from "lucide-react";
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
 * Base UI accordion with one open category at a time; the panel height animates over 240ms
 * and the chevron rotates. Visitors see « Pris » instead of a reserved gift's price; the
 * owner never does.
 */
export function CategoryAccordion({
  groups,
  currentGiftId,
  currentGroupKey,
  viewer,
  onSelectGift,
}: CategoryAccordionProps) {
  const [open, setOpen] = useState<string[]>(currentGroupKey ? [currentGroupKey] : []);

  useEffect(() => {
    setOpen(currentGroupKey ? [currentGroupKey] : []);
  }, [currentGroupKey]);

  return (
    <Accordion.Root
      value={open}
      onValueChange={(value) => setOpen((value as string[]).slice(-1))}
      className="flex flex-col"
    >
      {groups.map((group, index) => (
        <Accordion.Item
          key={group.key}
          value={group.key}
          className="border-b border-line last:border-b-0"
        >
          <Accordion.Header render={<h3 className="m-0" />}>
            <Accordion.Trigger className="accordion-row pressable">
              <span className="min-w-0">
                <span className="index-tag mr-2 text-small">{formatIndex(index)}</span>
                <span className={open.includes(group.key) ? "font-semibold" : "font-normal"}>
                  {group.name}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2.5 text-[14px] text-soft">
                {group.gifts.length}
                <ChevronRight className="accordion-chevron size-[18px]" aria-hidden="true" />
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className="accordion-panel">
            <ul className="flex flex-col gap-0.5 pb-2.5">
              {group.gifts.map((gift) => {
                const reserved = viewer !== "owner" && gift.is_reserved;
                return (
                  <li key={gift.id}>
                    <button
                      type="button"
                      className="accordion-item pressable"
                      aria-current={gift.id === currentGiftId ? "true" : undefined}
                      onClick={() => onSelectGift(gift.id)}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className="accordion-dot" aria-hidden="true" />
                        <span className="truncate">{gift.name}</span>
                      </span>
                      <span className="shrink-0">
                        {reserved
                          ? voice.list.reservedShort
                          : (formatPrice(gift.price, gift.currency) ?? voice.list.noPrice)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
