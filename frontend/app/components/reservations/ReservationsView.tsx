"use client";

import Link from "next/link";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorPanel } from "@/components/feedback/ErrorPanel";
import { Notice } from "@/components/feedback/Notice";
import { StatusMessage } from "@/components/feedback/StatusMessage";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/layout/Section";
import { ReservationCard } from "@/components/reservations/ReservationCard";
import { useAsync } from "@/hooks/use-async";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useReservationActions } from "@/hooks/use-reservation-actions";
import { fetchMyReservations } from "@/lib/api-public";
import type { MyReservation } from "@/lib/types";

export function ReservationsView() {
  const { status, token, isOwner } = useRequireAuth();
  const enabled = status === "authenticated" && !isOwner && Boolean(token);
  const list = useAsync<MyReservation[]>(
    (signal) => fetchMyReservations(token ?? "", signal),
    token ?? "no-token",
    enabled,
  );
  const actions = useReservationActions({
    onCancelled: (giftId) =>
      list.setData((current) => current?.filter((item) => item.gift.id !== giftId) ?? current),
  });

  return (
    <>
      <PageHero eyebrow="Espace visiteur" title="Mes réservations" />
      <Section className="flex-1">
        {status === "loading" ? (
          <p className="text-subhead text-ink-soft">Vérification de la session…</p>
        ) : null}
        {status === "anonymous" ? (
          <p className="text-subhead text-ink-soft">Redirection vers la connexion…</p>
        ) : null}
        {isOwner ? (
          <Notice href="/tableau-de-bord" linkLabel="Tableau de bord">
            Le compte propriétaire n&apos;a pas de réservations : c&apos;est votre liste que les
            autres réservent.
          </Notice>
        ) : null}
        {enabled ? (
          <>
            <StatusMessage message={actions.message} className="mb-4" />
            {list.loading ? (
              <p className="text-subhead text-ink-soft">Chargement de vos réservations…</p>
            ) : null}
            {list.error ? <ErrorPanel message={list.error} onRetry={list.refetch} /> : null}
            {!list.loading && list.data?.length === 0 ? (
              <EmptyState
                title="Aucune réservation"
                text="Réservez un cadeau depuis une liste pour le retrouver ici."
                action={
                  <Link href="/" className="btn btn-secondary">
                    Voir les listes
                  </Link>
                }
              />
            ) : null}
            {list.data && list.data.length > 0 ? (
              <ul className="grid gap-4 lg:grid-cols-2">
                {list.data.map((item) => (
                  <li key={item.reservation.id} className="flex">
                    <ReservationCard
                      item={item}
                      pending={actions.pendingId === item.gift.id}
                      onCancel={actions.cancel}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : null}
      </Section>
    </>
  );
}
