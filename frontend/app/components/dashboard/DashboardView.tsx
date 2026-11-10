"use client";

import { Notice } from "@/components/feedback/Notice";
import { voice } from "@/content/voice";
import { PageHero } from "@/components/layout/PageHero";
import { OwnerDashboard } from "@/components/dashboard/OwnerDashboard";
import { useRequireAuth } from "@/hooks/use-require-auth";

export function DashboardView() {
  const { status, isOwner } = useRequireAuth();

  if (isOwner) return <OwnerDashboard />;

  return (
    <>
      <PageHero eyebrow={voice.dashboard.eyebrow} title={voice.dashboard.title} />
      <section className="container flex-1 pt-10">
        {status === "loading" ? (
          <p className="text-secondary text-soft">{voice.reservations.checking}</p>
        ) : null}
        {status === "anonymous" ? (
          <p className="text-secondary text-soft">{voice.reservations.redirect}</p>
        ) : null}
        {status === "authenticated" ? (
          <Notice href="/mes-reservations" linkLabel={voice.nav.reservations}>
            {voice.dashboard.notOwner}
          </Notice>
        ) : null}
      </section>
    </>
  );
}
