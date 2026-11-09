import Link from "next/link";
import { MicroLabel } from "@/components/layout/MicroLabel";

const COLUMNS = [
  {
    title: "Explorer",
    links: [
      { href: "/", label: "Accueil" },
      { href: "/#comment-ca-marche", label: "Comment ça marche" },
    ],
  },
  {
    title: "Compte",
    links: [
      { href: "/connexion", label: "Connexion" },
      { href: "/inscription", label: "Inscription" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="container mt-auto pt-12 pb-10">
      <div className="hairline flex flex-col gap-8 pt-8 md:flex-row md:justify-between">
        <div className="flex max-w-xs flex-col gap-3">
          <p className="wordmark">ListaYours</p>
          <p className="text-secondary text-soft">
            Une liste de souhaits où la surprise reste intacte.
          </p>
        </div>
        <div className="flex gap-16 text-secondary">
          {COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col gap-2.5">
              <MicroLabel as="p">{column.title}</MicroLabel>
              {column.links.map((link) => (
                <Link key={link.href} href={link.href} className="inline-flex min-h-6 items-center">
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="text-small mt-10 text-soft">© 2026 ListaYours</p>
    </footer>
  );
}
