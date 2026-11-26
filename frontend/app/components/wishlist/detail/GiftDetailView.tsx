"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { voice } from "@/content/voice";
import { ErrorPanel } from "@/components/feedback/ErrorPanel";
import { GiftDetailStage } from "@/components/wishlist/detail/GiftDetailStage";
import { useActionToast } from "@/hooks/use-action-toast";
import { useAuth } from "@/hooks/use-auth";
import { usePublicWishlist } from "@/hooks/use-public-wishlist";
import { useReservationActions } from "@/hooks/use-reservation-actions";
import { parseViewMode, VIEW_PARAM } from "@/hooks/use-view-mode";
import { fireReservationConfetti } from "@/lib/confetti";
import { detailHref, listHref, locateGift } from "@/lib/gift-detail";
import { resolveViewer } from "@/lib/viewer";
import { groupGiftsByCategory } from "@/lib/wishlist-groups";
import { flattenGroups, shouldIgnoreKey } from "@/lib/wishlist-navigation";

type GiftDetailViewProps = { slug: string; giftId: string };

/**
 * Data layer of the gift page: loads the list once, finds the gift from the URL and wires the
 * reservation actions. Moving between gifts replaces the URL, so the browser's Back always
 * returns to the list in the view mode the visitor came from (`?vue=`).
 */
export function GiftDetailView({ slug, giftId }: GiftDetailViewProps) {
  const router = useRouter();
  const view = parseViewMode(useSearchParams().get(VIEW_PARAM));
  const { status, isOwner } = useAuth();
  const { data, error, loading, refetch, patchGift } = usePublicWishlist(slug);
  const viewer = resolveViewer({
    status,
    isOwner,
    reservationsVisible: data?.reservations_visible,
  });
  const loginHref = `/connexion?next=${encodeURIComponent(detailHref(slug, giftId, view))}`;

  const actions = useReservationActions({
    onReserved: (id) => {
      patchGift(id, { is_reserved: true, reserved_by_me: true });
      void fireReservationConfetti();
    },
    onCancelled: (id) => patchGift(id, { is_reserved: false, reserved_by_me: false }),
    onConflict: refetch,
  });
  useActionToast(actions.message);

  const flat = useMemo(
    () =>
      data
        ? flattenGroups(groupGiftsByCategory(data.categories, data.gifts, { dropEmpty: true }))
        : [],
    [data],
  );
  const position = locateGift(flat, giftId);
  const index = position?.index ?? 0;

  const [last, setLast] = useState({ index, direction: 0 });
  if (last.index !== index) setLast({ index, direction: index < last.index ? -1 : 1 });
  const positionRef = useRef(position);
  positionRef.current = position;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (shouldIgnoreKey(event.target)) return;
      const current = positionRef.current;
      const target = event.key === "ArrowLeft" ? current?.previous : current?.next;
      if (!target) return;
      event.preventDefault();
      router.replace(detailHref(slug, target.gift.id, view), { scroll: false });
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [router, slug, view]);

  if (loading) {
    return (
      <section className="gift-detail" aria-busy="true">
        <p className="eyebrow container">{voice.detail.loading}</p>
      </section>
    );
  }

  if (error || !data || !position) {
    return (
      <section className="container flex flex-col items-start gap-6 pt-8">
        <ErrorPanel
          message={error ?? voice.detail.notFound}
          onRetry={error ? refetch : undefined}
        />
        <Link href={listHref(slug, view)} className="btn btn-secondary">
          {voice.detail.back}
        </Link>
      </section>
    );
  }

  return (
    <GiftDetailStage
      slug={slug}
      view={view}
      flat={flat}
      position={position}
      direction={last.direction}
      viewer={viewer}
      loginHref={loginHref}
      pending={actions.pendingId === flat[position.index].gift.id}
      onReserve={actions.reserve}
      onCancel={actions.cancel}
    />
  );
}
