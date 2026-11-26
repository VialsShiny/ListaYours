"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Copy } from "lucide-react";
import { voice } from "@/content/voice";
import { Button } from "@/components/ui/button";
import { SwapLabel } from "@/components/ui/swap-label";
import { ReservationControl, type ViewerRole } from "@/components/wishlist/ReservationControl";
import { useClipboard } from "@/hooks/use-clipboard";
import { detailHref, type GiftPosition } from "@/lib/gift-detail";
import { safeHttpUrl } from "@/lib/safe-url";
import type { PublicGift } from "@/lib/types";
import { formatPosition, type FlatGift } from "@/lib/wishlist-navigation";

type GiftDetailBarProps = {
  slug: string;
  view: string;
  gift: PublicGift;
  position: GiftPosition<PublicGift>;
  total: number;
  viewer: ViewerRole;
  loginHref: string;
  pending: boolean;
  onReserve: (giftId: PublicGift["id"]) => void;
  onCancel: (giftId: PublicGift["id"]) => void;
};

const COPY_LABEL = {
  idle: voice.detail.copy,
  copied: voice.detail.copied,
  error: voice.detail.copyFailed,
};

function Arrow({
  target,
  slug,
  view,
  label,
  children,
}: {
  target: FlatGift<PublicGift> | null;
  slug: string;
  view: string;
  label: string;
  children: React.ReactNode;
}) {
  if (!target) {
    return (
      <span className="btn btn-icon btn-icon-lg" aria-disabled="true" aria-label={label}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={detailHref(slug, target.gift.id, view)}
      replace
      scroll={false}
      className="btn btn-icon btn-icon-lg"
      aria-label={label}
    >
      {children}
    </Link>
  );
}

/**
 * Bottom row: copy the gift's link on the left (so a visitor can pass the gift on to someone
 * who will chip in), the "01 / 04" counter between previous/next in the middle, and on the
 * right the shop link next to the reservation control (none for the owner).
 */
export function GiftDetailBar({
  slug,
  view,
  gift,
  position,
  total,
  viewer,
  loginHref,
  pending,
  onReserve,
  onCancel,
}: GiftDetailBarProps) {
  const clipboard = useClipboard();
  const productUrl = safeHttpUrl(gift.purchase_url);
  return (
    <div className="gift-detail-bar">
      <Button
        variant="secondary"
        className="btn-state min-w-44"
        onClick={() => void clipboard.copy(window.location.href)}
      >
        <Copy className="size-4" aria-hidden="true" />
        <SwapLabel label={COPY_LABEL[clipboard.status]} />
      </Button>
      <div className="gift-detail-counter" role="group" aria-label={voice.detail.counter}>
        <Arrow target={position.previous} slug={slug} view={view} label={voice.list.previous}>
          <ArrowLeft aria-hidden="true" />
        </Arrow>
        <p className="navigator-counter" aria-live="polite" aria-atomic="true">
          <b>{formatPosition(position.index)}</b>
          <span className="text-soft"> / {formatPosition(total - 1)}</span>
        </p>
        <Arrow target={position.next} slug={slug} view={view} label={voice.list.next}>
          <ArrowRight aria-hidden="true" />
        </Arrow>
      </div>
      <div className="gift-detail-actions">
        {productUrl ? (
          <a
            href={productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            {voice.detail.product}
          </a>
        ) : null}
        <ReservationControl
          gift={gift}
          viewer={viewer}
          loginHref={loginHref}
          pending={pending}
          onReserve={onReserve}
          onCancel={onCancel}
          className="md:w-auto md:min-w-44"
        />
      </div>
    </div>
  );
}
