"use client";

import { Notice } from "@/components/feedback/Notice";
import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/layout/Section";
import { OwnerDashboard } from "@/components/dashboard/OwnerDashboard";
import { useRequireAuth } from "@/hooks/use-require-auth";

export function DashboardView() {
  const { status, isOwner, user } = useRequireAuth();

  return (
    <>
      <PageHero eyebrow="Espace propriétaire" title="Tableau de bord">
        {user ? (
          <p className="text-subhead mt-4">Connecté en tant que {user.display_name}.</p>
        ) : null}
      </PageHero>
      {status === "loading" ? (
        <Section>
          <p className="text-subhead text-ink-soft">Vérification de la session…</p>
        </Section>
      ) : null}
      {status === "anonymous" ? (
        <Section>
          <p className="text-subhead text-ink-soft">Redirection vers la connexion…</p>
        </Section>
      ) : null}
      {status === "authenticated" && !isOwner ? (
        <Section className="flex-1">
          <Notice href="/mes-reservations" linkLabel="Mes réservations">
            Réservé au propriétaire.
          </Notice>
        </Section>
      ) : null}
      {isOwner ? <OwnerDashboard /> : null}
    </>
  );
}
