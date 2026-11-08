import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="hairline mt-auto px-4 py-6 md:px-12 lg:px-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="display text-lg leading-none">ListaYours.</p>
        <p className="micro text-ink-soft">Parcourez. Réservez. Gardez la surprise.</p>
        <Link href="/inscription" className="link-arrow micro text-ink">
          Créer un compte
        </Link>
      </div>
    </footer>
  );
}
