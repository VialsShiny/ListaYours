"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DisplayTitle } from "@/components/layout/DisplayTitle";
import { MicroLabel } from "@/components/layout/MicroLabel";
import { HeroMotif } from "@/components/landing/HeroMotif";
import { buttonVariants } from "@/components/ui/button";
import { usePublicWishlists } from "@/hooks/use-public-wishlist";
import { cn } from "@/lib/utils";

export function Hero() {
  const { data, loading, error } = usePublicWishlists();
  const first = data?.[0];

  return (
    <section className="relative overflow-hidden bg-surface px-4 pt-16 pb-20 md:px-12 md:pt-24 md:pb-28 lg:px-16">
      <HeroMotif className="pointer-events-none absolute inset-0 hidden md:block" />
      <div className="relative grid gap-10 md:grid-cols-[auto_1fr]">
        <p className="vertical-label micro hidden self-end text-ink-soft md:block">
          Liste de souhaits — édition 01
        </p>
        <div className="max-w-5xl">
          <MicroLabel className="mb-6">Plateforme de listes de souhaits</MicroLabel>
          <DisplayTitle size="hero">ListaYours</DisplayTitle>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink md:text-xl">
            La liste de souhaits à partager : parcourez, réservez, et gardez la surprise entière.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            {first ? (
              <Link
                href={`/l/${first.slug}`}
                className={cn(buttonVariants({ variant: "primary" }), "px-6 py-4")}
              >
                Voir la liste
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : (
              <span
                className={cn(
                  buttonVariants({ variant: "primary" }),
                  "cursor-default px-6 py-4 opacity-45",
                )}
                aria-disabled="true"
              >
                Voir la liste
                <ArrowRight className="size-4" aria-hidden="true" />
              </span>
            )}
            <Link href="/inscription" className="link-arrow micro text-ink">
              Créer un compte
            </Link>
          </div>
          <p role="status" aria-live="polite" className="mt-4 min-h-5 text-sm text-ink-soft">
            {loading ? "Recherche de la liste publiée…" : null}
            {!loading && !first && !error ? "Aucune liste publiée pour le moment." : null}
            {!loading && error ? `Aucune liste disponible : ${error}` : null}
            {first?.description && !loading ? first.description : null}
          </p>
        </div>
      </div>
    </section>
  );
}
