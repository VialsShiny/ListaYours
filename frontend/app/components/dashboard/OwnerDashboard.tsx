"use client";

import { ErrorPanel } from "@/components/feedback/ErrorPanel";
import { Notice } from "@/components/feedback/Notice";
import { StatusMessage } from "@/components/feedback/StatusMessage";
import { Section } from "@/components/layout/Section";
import { CategoryManager } from "@/components/dashboard/CategoryManager";
import { DashboardSectionTitle } from "@/components/dashboard/DashboardSectionTitle";
import { GiftManager } from "@/components/dashboard/GiftManager";
import { SettingsForm } from "@/components/dashboard/SettingsForm";
import { useOwnerData } from "@/hooks/use-owner-data";

export function OwnerDashboard() {
  const store = useOwnerData();

  return (
    <>
      <div className="px-4 md:px-12 lg:px-16">
        <Notice>
          Rappel : vous ne voyez jamais les réservations. Vos proches gardent la surprise.
        </Notice>
        <StatusMessage message={store.actionError} tone="error" className="py-3" />
      </div>

      {store.loading && !store.data ? (
        <Section tone="white" aria-busy="true">
          <p className="micro mb-6 text-ink-soft">Chargement du tableau de bord…</p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="skeleton h-40" />
            <div className="skeleton h-40" />
            <div className="skeleton h-40" />
          </div>
        </Section>
      ) : null}

      {store.error && !store.data ? (
        <Section tone="white">
          <ErrorPanel message={store.error} onRetry={store.refetch} />
        </Section>
      ) : null}

      {store.data ? (
        <>
          <Section tone="white" aria-labelledby="reglages">
            <DashboardSectionTitle id="reglages" index="01" title="Réglages" />
            <SettingsForm store={store} wishlist={store.data.wishlist} />
          </Section>
          <Section tone="band" aria-labelledby="categories">
            <DashboardSectionTitle id="categories" index="02" title="Catégories" />
            <CategoryManager store={store} categories={store.data.categories} />
          </Section>
          <Section tone="white" aria-labelledby="cadeaux">
            <DashboardSectionTitle id="cadeaux" index="03" title="Cadeaux" />
            <GiftManager
              store={store}
              categories={store.data.categories}
              gifts={store.data.gifts}
            />
          </Section>
        </>
      ) : null}
    </>
  );
}
