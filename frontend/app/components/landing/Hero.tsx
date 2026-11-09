"use client";

import Link from "next/link";
import { DisplayTitle } from "@/components/layout/DisplayTitle";
import { MicroLabel } from "@/components/layout/MicroLabel";
import { SampleCard } from "@/components/landing/SampleCard";
import { usePublicWishlists } from "@/hooks/use-public-wishlist";

export function Hero() {
  const { data, loading, error } = usePublicWishlists();
  const first = data?.[0];

  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-title">
      <p aria-hidden="true" className="ghost-word -top-4 right-[-6%] hidden md:block">
        LISTE
      </p>
      <div className="container relative grid grid-cols-[minmax(0,1fr)] gap-10 pt-8 md:grid-cols-[minmax(0,1fr)_300px] md:items-start md:gap-12 md:pt-14 xl:gap-16">
        <div className="flex min-w-0 flex-col gap-6 md:gap-9">
          <MicroLabel>Listes de souhaits partagées</MicroLabel>
          <DisplayTitle size="hero" id="hero-title" className="tracking-[-0.05em]">
            Gardez la surprise
          </DisplayTitle>
          <p className="text-body max-w-[46ch] text-soft md:text-lead">
            Publiez votre liste, partagez un seul lien. Vos proches réservent un cadeau sans
            doublon, et vous ne savez jamais lequel.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link href="/inscription" className="btn btn-primary btn-hero">
              Créer ma liste
            </Link>
            {first ? (
              <Link href={`/l/${first.slug}`} className="btn btn-secondary btn-hero">
                Voir un exemple
              </Link>
            ) : (
              <span className="btn btn-secondary btn-hero" aria-disabled="true">
                Voir un exemple
              </span>
            )}
          </div>
          <p role="status" aria-live="polite" className="text-small min-h-5 text-soft">
            {loading ? "Recherche de la liste publiée…" : null}
            {!loading && !first && !error ? "Aucune liste publiée pour le moment." : null}
            {!loading && error ? `Aucune liste disponible : ${error}` : null}
          </p>
        </div>
        <SampleCard slug={first?.slug ?? null} className="md:mt-16" />
      </div>
    </section>
  );
}
