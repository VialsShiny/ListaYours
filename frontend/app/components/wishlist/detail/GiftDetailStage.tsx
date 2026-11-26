"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft, Gift } from "lucide-react";
import { voice } from "@/content/voice";
import { GiftPrice } from "@/components/wishlist/GiftPrice";
import type { ViewerRole } from "@/components/wishlist/ReservationControl";
import { GiftDetailBar } from "@/components/wishlist/detail/GiftDetailBar";
import { GiftDetailNav } from "@/components/wishlist/detail/GiftDetailNav";
import { listHref, siblingWindow, type GiftPosition } from "@/lib/gift-detail";
import { safeHttpUrl } from "@/lib/safe-url";
import type { PublicGift } from "@/lib/types";
import { formatIndex, type FlatGift } from "@/lib/wishlist-navigation";

export type GiftDetailStageProps = {
  slug: string;
  view: string;
  flat: FlatGift<PublicGift>[];
  position: GiftPosition<PublicGift>;
  direction: number;
  viewer: ViewerRole;
  loginHref: string;
  pending: boolean;
  onReserve: (giftId: PublicGift["id"]) => void;
  onCancel: (giftId: PublicGift["id"]) => void;
};

/**
 * The gift page itself: back link and sibling mini-nav on top, the photo centred over its name
 * as a faded giant headline, the details, then the bottom bar. The scene is keyed by gift so
 * each gift enters once: a rise on first load (`--rise`), a short slide in the direction of
 * travel afterwards (`--dir`), a fade only for keyboard moves and reduced motion.
 * Owners get no muted photo and no reservation control.
 */
export function GiftDetailStage({
  slug,
  view,
  flat,
  position,
  direction,
  viewer,
  loginHref,
  pending,
  onReserve,
  onCancel,
}: GiftDetailStageProps) {
  const { gift, groupIndex, groupName } = flat[position.index];
  const muted = viewer !== "owner" && gift.is_reserved && !gift.reserved_by_me;
  const imageUrl = safeHttpUrl(gift.image_url);
  const sceneStyle = { "--dir": direction, "--rise": direction === 0 ? 1 : 0 } as CSSProperties;

  return (
    <section className="gift-detail" data-overflow-ok="" aria-labelledby="cadeau-titre">
      <div className="container gift-detail-inner">
        <div className="gift-detail-top">
          <Link href={listHref(slug, view)} className="btn btn-text -ml-4">
            <ArrowLeft className="size-4" aria-hidden="true" />
            {voice.detail.back}
          </Link>
          <GiftDetailNav
            items={siblingWindow(flat, position.index)}
            currentId={gift.id}
            slug={slug}
            view={view}
          />
        </div>
        <div key={gift.id} className="gift-detail-scene" style={sceneStyle}>
          <p aria-hidden="true" className="gift-detail-ghost" data-overflow-ok="">
            {gift.name}
          </p>
          <div className="gift-detail-photo" data-muted={muted ? "true" : undefined}>
            {imageUrl ? (
              <img src={imageUrl} alt="" decoding="async" referrerPolicy="no-referrer" />
            ) : (
              <Gift className="size-32 text-soft" strokeWidth={1} aria-hidden="true" />
            )}
          </div>
          <div className="gift-detail-info">
            <p className="index-tag">
              {formatIndex(groupIndex)} · {groupName}
            </p>
            <h1 id="cadeau-titre" className="display display-section display-user">
              {gift.name}
            </h1>
            <GiftPrice
              price={gift.price}
              oldPrice={gift.old_price}
              currency={gift.currency}
              muted={muted}
              className="navigator-price justify-center"
            />
            <p className="text-body text-soft [text-wrap:pretty]">
              {gift.description ?? voice.detail.noDescription}
            </p>
          </div>
        </div>
        <GiftDetailBar
          slug={slug}
          view={view}
          gift={gift}
          position={position}
          total={flat.length}
          viewer={viewer}
          loginHref={loginHref}
          pending={pending}
          onReserve={onReserve}
          onCancel={onCancel}
        />
      </div>
    </section>
  );
}
