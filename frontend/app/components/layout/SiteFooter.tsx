import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="container mt-auto border-t border-line py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="wordmark text-body">ListaYours.</p>
        <p className="eyebrow">Parcourez. Réservez. Gardez la surprise.</p>
        <Link href="/inscription" className="text-link text-secondary">
          Créer un compte
        </Link>
      </div>
    </footer>
  );
}
