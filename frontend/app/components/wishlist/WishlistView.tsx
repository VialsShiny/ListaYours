"use client";

import { useMemo } from "react";
import { ErrorPanel } from "@/components/feedback/ErrorPanel";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Notice } from "@/components/feedback/Notice";
import { CategoryBar } from "@/components/wishlist/CategoryBar";
import { CategorySection } from "@/components/wishlist/CategorySection";
import { GiftGridSkeleton } from "@/components/wishlist/GiftCardSkeleton";
import { GiftNavigator } from "@/components/wishlist/GiftNavigator";
import type { ViewerRole } from "@/components/wishlist/ReservationControl";
import { WishlistHeader } from "@/components/wishlist/WishlistHeader";
import { WishlistHeaderSkeleton } from "@/components/wishlist/WishlistHeaderSkeleton";
import { useActionToast } from "@/hooks/use-action-toast";
import { useAuth } from "@/hooks/use-auth";
import { usePublicWishlist } from "@/hooks/use-public-wishlist";
import { useReservationActions } from "@/hooks/use-reservation-actions";
import { useViewMode } from "@/hooks/use-view-mode";
import { fireReservationConfetti } from "@/lib/confetti";
import { groupGiftsByCategory } from "@/lib/wishlist-groups";

export function WishlistView({ slug }: { slug: string }) {
  const { status, isOwner } = useAuth();
  const { data, error, loading, refetch, patchGift } = usePublicWishlist(slug);
  const { view, hrefFor, switchTo } = useViewMode();
  const loginHref = `/connexion?next=${encodeURIComponent(`/l/${slug}`)}`;
  const viewer: ViewerRole = isOwner
    ? "owner"
    : status === "authenticated"
      ? "visitor"
      : "anonymous";

  const actions = useReservationActions({
    onReserved: (id) => {
      patchGift(id, { is_reserved: true, reserved_by_me: true });
      void fireReservationConfetti();
    },
    onCancelled: (id) => patchGift(id, { is_reserved: false, reserved_by_me: false }),
    onConflict: refetch,
  });

  useActionToast(actions.message);

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
          <GiftGridSkeleton />
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

  const giftProps = {
    viewer,
    loginHref,
    pendingId: actions.pendingId,
    onReserve: actions.reserve,
    onCancel: actions.cancel,
  };

  return (
    <>
      {viewer === "owner" ? (
        <div className="container pt-8 md:pt-10">
          <Notice title="Aperçu propriétaire">
            Vous voyez votre liste comme si chaque cadeau était disponible. Aucune réservation ne
            vous est jamais montrée.
          </Notice>
        </div>
      ) : null}
      <WishlistHeader
        wishlist={data.wishlist}
        giftCount={data.gifts.length}
        view={view}
        hrefFor={hrefFor}
        onSelect={switchTo}
      />
      {viewer === "anonymous" ? (
        <div className="container mt-6">
          <Notice href={loginHref} linkLabel="Se connecter">
            Connectez-vous pour réserver un cadeau. Le propriétaire ne verra rien.
          </Notice>
        </div>
      ) : null}
      {groups.length === 0 ? (
        <section className="container pt-12">
          <EmptyState title="Aucun cadeau pour le moment" text="La liste se remplit bientôt." />
        </section>
      ) : view === "naviguer" ? (
        <GiftNavigator groups={groups} {...giftProps} />
      ) : (
        <div className="container flex flex-col gap-4 pt-10 md:pt-12">
          <CategoryBar groups={groups} />
          {groups.map((group, index) => (
            <CategorySection key={group.key} group={group} index={index} {...giftProps} />
          ))}
        </div>
      )}
    </>
  );
}
