"use client";

import { useState } from "react";
import { voice } from "@/content/voice";
import Link from "next/link";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorPanel } from "@/components/feedback/ErrorPanel";
import { Notice } from "@/components/feedback/Notice";
import { PageHero } from "@/components/layout/PageHero";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ReservationCard } from "@/components/reservations/ReservationCard";
import { ReservationsTotal } from "@/components/reservations/ReservationsTotal";
import { useActionToast } from "@/hooks/use-action-toast";
import { useAsync } from "@/hooks/use-async";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useReservationActions } from "@/hooks/use-reservation-actions";
import { fetchMyReservations } from "@/lib/api-public";
import { sumReservations } from "@/lib/reservations-total";
import type { MyReservation } from "@/lib/types";

export function ReservationsView() {
  const { status, token, isOwner } = useRequireAuth();
  const enabled = status === "authenticated" && !isOwner && Boolean(token);
  const [toCancel, setToCancel] = useState<MyReservation | null>(null);
  const list = useAsync<MyReservation[]>(
    (signal) => fetchMyReservations(token ?? "", signal),
    token ?? "no-token",
    enabled,
  );
  const actions = useReservationActions({
    onCancelled: (giftId) =>
      list.setData((current) => current?.filter((item) => item.gift.id !== giftId) ?? current),
  });
  const items = list.data ?? [];
  const total = sumReservations(items);
  useActionToast(actions.message);

  async function confirmCancel() {
    if (!toCancel) return;
    const ok = await actions.cancel(toCancel.gift.id);
    if (ok) setToCancel(null);
  }

  return (
    <>
      <PageHero
        eyebrow={voice.reservations.eyebrow}
        title={voice.reservations.title}
        aside={total ? <ReservationsTotal amount={total.amount} currency={total.currency} /> : null}
      />
      <section className="container flex flex-1 flex-col gap-4 pt-10 md:pt-14">
        {status === "loading" ? (
          <p className="text-secondary text-soft">{voice.reservations.checking}</p>
        ) : null}
        {status === "anonymous" ? (
          <p className="text-secondary text-soft">{voice.reservations.redirect}</p>
        ) : null}
        {isOwner ? (
          <Notice href="/tableau-de-bord" linkLabel={voice.nav.dashboard}>
            {voice.reservations.ownerText}
          </Notice>
        ) : null}
        {enabled ? (
          <>
            {list.loading ? (
              <p className="text-secondary text-soft">{voice.reservations.loading}</p>
            ) : null}
            {list.error ? <ErrorPanel message={list.error} onRetry={list.refetch} /> : null}
            {!list.loading && items.length === 0 && !list.error ? (
              <EmptyState
                title={voice.reservations.emptyTitle}
                text={voice.reservations.emptyText}
                action={
                  <Link href="/" className="btn btn-secondary btn-sm">
                    {voice.reservations.emptyAction}
                  </Link>
                }
              />
            ) : null}
            {items.length > 0 ? (
              <>
                <p className="text-[16px] text-soft">{voice.reservations.count(items.length)}</p>
                <ul className="flex flex-col gap-3.5 md:gap-4">
                  {items.map((item) => (
                    <li key={item.reservation.id} className="flex">
                      <ReservationCard
                        item={item}
                        pending={actions.pendingId === item.gift.id}
                        onCancel={setToCancel}
                      />
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </>
        ) : null}
      </section>
      <ConfirmDialog
        open={toCancel !== null}
        title={voice.reservations.dialogTitle}
        description={voice.reservations.dialogText}
        confirmLabel={voice.reservations.cancel}
        cancelLabel={voice.reservations.keep}
        busy={actions.pendingId !== null}
        onConfirm={confirmCancel}
        onCancel={() => setToCancel(null)}
      />
    </>
  );
}
