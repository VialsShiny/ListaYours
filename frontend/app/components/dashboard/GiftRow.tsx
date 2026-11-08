"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, Gift, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GiftPrice } from "@/components/wishlist/GiftPrice";
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
  return (
    <li className="flex flex-wrap items-center gap-4 px-4 py-3 md:flex-nowrap">
      <div className="size-14 shrink-0 overflow-hidden bg-surface-alt">
        {gift.image_url ? (
          <img
            src={gift.image_url}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-block" aria-hidden="true">
            <Gift className="size-5" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="display truncate text-lg leading-tight">{gift.name}</p>
          {!gift.is_visible ? (
            <span className="micro border border-ink px-2 py-0.5 text-ink">Masqué</span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <GiftPrice
            price={gift.price}
            oldPrice={gift.old_price}
            currency={gift.currency}
            className="text-xs"
          />
          <span className="micro text-ink-soft">{categoryName}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="icon"
          aria-label={`Modifier ${gift.name}`}
          disabled={busy}
          onClick={onEdit}
        >
          <Pencil aria-hidden="true" />
        </Button>
        <Button
          variant="icon"
          aria-label={gift.is_visible ? `Masquer ${gift.name}` : `Afficher ${gift.name}`}
          aria-pressed={!gift.is_visible}
          disabled={busy}
          onClick={onToggleVisibility}
        >
          {gift.is_visible ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
        </Button>
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
        <Button
          variant="icon"
          aria-label={`Supprimer ${gift.name}`}
          disabled={busy}
          onClick={onDelete}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}
