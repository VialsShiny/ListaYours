"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ErrorPanel } from "@/components/feedback/ErrorPanel";
import { Notice } from "@/components/feedback/Notice";
import { PageHero } from "@/components/layout/PageHero";
import { SectionSwitch } from "@/components/dashboard/SectionSwitch";
import { CategoryManager } from "@/components/dashboard/CategoryManager";
import { DashboardSectionTitle } from "@/components/dashboard/DashboardSectionTitle";
import { GiftManager } from "@/components/dashboard/GiftManager";
import { SettingsForm } from "@/components/dashboard/SettingsForm";
import { useOwnerData } from "@/hooks/use-owner-data";
import { notifyError } from "@/lib/toast";

const SECTIONS = [
  { id: "parametres", label: "Paramètres" },
  { id: "categories", label: "Catégories" },
  { id: "cadeaux", label: "Cadeaux" },
];

export function OwnerDashboard() {
  const store = useOwnerData();
  const slug = store.data?.wishlist.slug;

  useEffect(() => {
    if (store.actionError) notifyError(store.actionError);
  }, [store.actionError]);

  return (
    <>
      <PageHero
        eyebrow="Espace propriétaire"
        title="Tableau de bord"
        aside={
          slug ? (
            <Link href={`/l/${slug}`} className="btn btn-secondary">
              Voir ma liste →
            </Link>
          ) : null
        }
      >
        <div className="mt-7 flex flex-col gap-5">
          <Notice>
            L&apos;état des réservations n&apos;est jamais affiché ici. C&apos;est voulu : la
            surprise reste entière.
          </Notice>
          <SectionSwitch sections={SECTIONS} ready={Boolean(store.data)} />
        </div>
      </PageHero>

      {store.loading && !store.data ? (
        <section className="container pt-12" aria-busy="true">
          <p className="eyebrow mb-6">Chargement du tableau de bord…</p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="skeleton h-40 rounded-[24px]" />
            <div className="skeleton h-40 rounded-[24px]" />
            <div className="skeleton h-40 rounded-[24px]" />
          </div>
        </section>
      ) : null}

      {store.error && !store.data ? (
        <section className="container pt-12">
          <ErrorPanel message={store.error} onRetry={store.refetch} />
        </section>
      ) : null}

      {store.data ? (
        <div className="container flex flex-col gap-10 pt-12 md:gap-16 md:pt-16">
          <section id="parametres" aria-labelledby="parametres-titre" className="scroll-mt-6">
            <DashboardSectionTitle id="parametres-titre" index="#01" title="Paramètres" />
            <SettingsForm store={store} wishlist={store.data.wishlist} />
          </section>
          <section id="categories" aria-labelledby="categories-titre" className="scroll-mt-6">
            <DashboardSectionTitle id="categories-titre" index="#02" title="Catégories" />
            <CategoryManager
              store={store}
              categories={store.data.categories}
              gifts={store.data.gifts}
            />
          </section>
          <section id="cadeaux" aria-labelledby="cadeaux-titre" className="scroll-mt-6">
            <GiftManager
              store={store}
              categories={store.data.categories}
              gifts={store.data.gifts}
            />
          </section>
        </div>
      ) : null}
    </>
  );
}
