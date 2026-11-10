"use client";

import { ArrowDown, ArrowUp, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { formatPrice } from "@/lib/format";
import type { OwnerGift } from "@/lib/types";

type GiftRowProps = {
  gift: OwnerGift;
  categoryName: string;
  isFirst: boolean;
  isLast: boolean;
  busy: boolean;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
};

export function GiftRow({
  gift,
  categoryName,
  isFirst,
  isLast,
  busy,
  onEdit,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  onDelete,
}: GiftRowProps) {
  const price = formatPrice(gift.price, gift.currency) ?? "Prix non renseigné";
  return (
    <li className="list-row min-h-24 flex-wrap md:flex-nowrap">
      <span className="drag-handle max-md:hidden" aria-hidden="true">
        ⋮⋮
      </span>
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
        <Button
          variant="icon"
          aria-label={`Monter ${gift.name}`}
          disabled={busy || isFirst}
          onClick={onMoveUp}
        >
          <ArrowUp aria-hidden="true" />
        </Button>
        <Button
          variant="icon"
          aria-label={`Descendre ${gift.name}`}
          disabled={busy || isLast}
          onClick={onMoveDown}
        >
          <ArrowDown aria-hidden="true" />
        </Button>
        <Button variant="secondary" size="sm" disabled={busy} onClick={onEdit}>
          Modifier
        </Button>
        <Button variant="text-accent" disabled={busy} onClick={onDelete}>
          Supprimer
        </Button>
      </div>
    </li>
  );
}
