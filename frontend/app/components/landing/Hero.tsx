"use client";

import Link from "next/link";
import { DisplayTitle } from "@/components/layout/DisplayTitle";
import { MicroLabel } from "@/components/layout/MicroLabel";
import { usePublicWishlists } from "@/hooks/use-public-wishlist";
import { LANDING_STEPS } from "@/lib/landing-steps";

export function Hero() {
  const { data, loading, error } = usePublicWishlists();
  const first = data?.[0];

  return (
    <section className="container pt-4 md:pt-6" aria-labelledby="hero-title">
      <div className="hero">
        <MicroLabel>Plateforme de listes de souhaits</MicroLabel>
        <DisplayTitle size="hero" id="hero-title" className="mt-6">
          ListaYours
        </DisplayTitle>
        <p className="text-headline mt-6">
          La liste de souhaits à partager : parcourez, réservez, et gardez la surprise entière.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          {first ? (
            <Link href={`/l/${first.slug}`} className="btn btn-arrow">
              Voir la liste
            </Link>
          ) : (
            <span className="btn btn-arrow" aria-disabled="true">
              Voir la liste
            </span>
          )}
          <Link href="/inscription" className="hero-link text-callout">
            Créer un compte
          </Link>
        </div>
        <p role="status" aria-live="polite" className="text-subhead mt-4 min-h-5">
          {loading ? "Recherche de la liste publiée…" : null}
          {!loading && !first && !error ? "Aucune liste publiée pour le moment." : null}
          {!loading && error ? `Aucune liste disponible : ${error}` : null}
          {first?.description && !loading ? first.description : null}
        </p>
        <ol className="mt-10 grid gap-6 border-t border-water/20 pt-6 sm:grid-cols-3">
          {LANDING_STEPS.map((step) => (
            <li key={step.number} className="flex flex-col gap-1">
              <span className="index-tag">{step.number}</span>
              <span className="text-callout font-semibold text-water">{step.title}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
