"use client";

import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoldButton } from "@/components/ui/hold-button";
import { Toggle } from "@/components/ui/toggle";
import { SortableRow } from "@/components/dashboard/SortableRow";
import { formatPrice } from "@/lib/format";
import type { OwnerGift } from "@/lib/types";

type GiftRowProps = {
  gift: OwnerGift;
  categoryName: string;
  busy: boolean;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
};

export function GiftRow({
  gift,
  categoryName,
  busy,
  onEdit,
  onToggleVisibility,
  onDelete,
}: GiftRowProps) {
  const price = formatPrice(gift.price, gift.currency) ?? "Prix non renseigné";
  return (
    <SortableRow
      id={gift.id}
      handleLabel={`Réordonner ${gift.name}`}
      className="list-row min-h-24 flex-wrap md:flex-nowrap"
    >
      <div className="thumb">
        {gift.image_url ? (
          <img src={gift.image_url} alt="" loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex size-full items-center justify-center text-soft" aria-hidden="true">
            <Gift className="size-5" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="display-card line-clamp-2 text-[16px] md:text-lead">{gift.name}</p>
        <p className="text-small text-soft">
          {categoryName}
          <span className="md:hidden"> · {price}</span>
        </p>
      </div>
      <p className="price w-[90px] shrink-0 text-[16px] max-md:hidden">{price}</p>
      <Toggle
        id={`gift-${gift.id}-visible`}
        label={
          <>
            Visible<span className="sr-only"> : {gift.name}</span>
          </>
        }
        size="sm"
        checked={gift.is_visible}
        disabled={busy}
        onChange={onToggleVisibility}
        className="shrink-0 max-md:[&_label]:sr-only"
      />
      <div className="flex w-full shrink-0 items-center gap-1 md:w-auto">
        <Button variant="secondary" size="sm" disabled={busy} onClick={onEdit}>
          Modifier
        </Button>
        <HoldButton
          label="Supprimer"
          holdLabel={`Maintenir pour supprimer ${gift.name}`}
          disabled={busy}
          onConfirm={onDelete}
        />
      </div>
    </SortableRow>
  );
}
