"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Notice } from "@/components/feedback/Notice";
import { DisplayTitle } from "@/components/layout/DisplayTitle";
import { MicroLabel } from "@/components/layout/MicroLabel";
import { Section } from "@/components/layout/Section";
import { OwnerDashboard } from "@/components/dashboard/OwnerDashboard";
import { useAuth } from "@/hooks/use-auth";

export function DashboardView() {
  const { status, isOwner, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") router.replace("/connexion?next=%2Ftableau-de-bord");
  }, [status, router]);

  return (
    <>
      <header className="bg-surface px-4 pt-12 pb-12 md:px-12 md:pt-20 lg:px-16">
        <MicroLabel className="mb-6">Espace propriétaire</MicroLabel>
        <DisplayTitle size="section">Tableau de bord</DisplayTitle>
        {user ? (
          <p className="mt-6 text-sm text-ink-soft">Connecté en tant que {user.display_name}.</p>
        ) : null}
      </header>
      {status === "loading" ? (
        <Section tone="white">
          <p className="text-sm text-ink-soft">Vérification de la session…</p>
        </Section>
      ) : null}
      {status === "anonymous" ? (
        <Section tone="white">
          <p className="text-sm text-ink-soft">Redirection vers la connexion…</p>
        </Section>
      ) : null}
      {status === "authenticated" && !isOwner ? (
        <Section tone="white" className="flex-1">
          <Notice href="/mes-reservations" linkLabel="Mes réservations">
            Réservé au propriétaire.
          </Notice>
        </Section>
      ) : null}
      {isOwner ? <OwnerDashboard /> : null}
    </>
  );
}
