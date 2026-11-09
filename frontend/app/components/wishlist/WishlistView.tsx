"use client";

import { useMemo } from "react";
import { ErrorPanel } from "@/components/feedback/ErrorPanel";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Notice } from "@/components/feedback/Notice";
import { StatusMessage } from "@/components/feedback/StatusMessage";
import { CategorySection } from "@/components/wishlist/CategorySection";
import { GiftCarouselSkeleton } from "@/components/wishlist/GiftCarousel";
import type { ViewerRole } from "@/components/wishlist/ReservationControl";
import { WishlistHeader } from "@/components/wishlist/WishlistHeader";
import { WishlistHeaderSkeleton } from "@/components/wishlist/WishlistHeaderSkeleton";
import { useAuth } from "@/hooks/use-auth";
import { usePublicWishlist } from "@/hooks/use-public-wishlist";
import { useReservationActions } from "@/hooks/use-reservation-actions";
import { groupGiftsByCategory } from "@/lib/wishlist-groups";

export function WishlistView({ slug }: { slug: string }) {
  const { status, isOwner } = useAuth();
  const { data, error, loading, refetch, patchGift } = usePublicWishlist(slug);
  const loginHref = `/connexion?next=${encodeURIComponent(`/l/${slug}`)}`;
  const viewer: ViewerRole = isOwner
    ? "owner"
    : status === "authenticated"
      ? "visitor"
      : "anonymous";

  const actions = useReservationActions({
    onReserved: (id) => patchGift(id, { is_reserved: true, reserved_by_me: true }),
    onCancelled: (id) => patchGift(id, { is_reserved: false, reserved_by_me: false }),
    onConflict: refetch,
  });

  const groups = useMemo(
    () => (data ? groupGiftsByCategory(data.categories, data.gifts, { dropEmpty: true }) : []),
    [data],
  );

  if (loading) {
    return (
      <>
        <WishlistHeaderSkeleton />
        <section className="container pt-12" aria-busy="true">
          <p className="eyebrow mb-6">Chargement de la liste…</p>
          <GiftCarouselSkeleton />
        </section>
      </>
    );
  }

  if (error || !data) {
    return (
      <section className="container pt-8">
        <ErrorPanel message={error ?? "Cette liste est introuvable."} onRetry={refetch} />
      </section>
    );
  }

  return (
    <>
      <WishlistHeader wishlist={data.wishlist} anchors={groups} giftCount={data.gifts.length} />
      <div className="container mt-6 flex flex-col gap-3 empty:hidden">
        {viewer === "anonymous" && !data.reservations_visible ? (
          <Notice href={loginHref} linkLabel="Se connecter">
            Connectez-vous pour voir les disponibilités et réserver.
          </Notice>
        ) : null}
        {viewer === "owner" ? (
          <Notice>
            Aperçu propriétaire : vous voyez la liste comme un visiteur, sans aucune information de
            réservation.
          </Notice>
        ) : null}
        <StatusMessage message={actions.message} />
      </div>
      {groups.length === 0 ? (
        <section className="container pt-12">
          <EmptyState title="Aucun cadeau pour le moment" text="La liste se remplit bientôt." />
        </section>
      ) : (
        groups.map((group, index) => (
          <CategorySection
            key={group.key}
            group={group}
            index={index}
            viewer={viewer}
            loginHref={loginHref}
            pendingId={actions.pendingId}
            onReserve={actions.reserve}
            onCancel={actions.cancel}
          />
        ))
      )}
    </>
  );
}
