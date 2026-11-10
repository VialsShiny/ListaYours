"use client";

import { Notice } from "@/components/feedback/Notice";
import { PageHero } from "@/components/layout/PageHero";
import { OwnerDashboard } from "@/components/dashboard/OwnerDashboard";
import { useRequireAuth } from "@/hooks/use-require-auth";

export function DashboardView() {
  const { status, isOwner } = useRequireAuth();

  if (isOwner) return <OwnerDashboard />;

  return (
    <>
      <PageHero eyebrow="Espace propriétaire" title="Tableau de bord" />
      <section className="container flex-1 pt-10">
        {status === "loading" ? (
          <p className="text-secondary text-soft">Vérification de la session…</p>
        ) : null}
        {status === "anonymous" ? (
          <p className="text-secondary text-soft">Redirection vers la connexion…</p>
        ) : null}
        {status === "authenticated" ? (
          <Notice href="/mes-reservations" linkLabel="Mes réservations">
            Cet espace est réservé au propriétaire de la liste.
          </Notice>
        ) : null}
      </section>
    </>
  );
}
