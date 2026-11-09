"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { usePublicWishlists } from "@/hooks/use-public-wishlist";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
  return (
    <Link href={href} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}

export function SiteHeader() {
  const { status, user, isOwner, signOut } = useAuth();
  const wishlists = usePublicWishlists();
  const firstSlug = wishlists.data?.[0]?.slug;

  return (
    <header className="nav">
      <Link href="/" className="wordmark text-lead shrink-0">
        ListaYours.
      </Link>
      <nav aria-label="Navigation principale" className="flex min-w-0 items-center gap-2">
        <ul className="nav-links">
          {firstSlug ? (
            <li>
              <NavLink href={`/l/${firstSlug}`}>La liste</NavLink>
            </li>
          ) : null}
          {status === "authenticated" && !isOwner ? (
            <li>
              <NavLink href="/mes-reservations">Mes réservations</NavLink>
            </li>
          ) : null}
          {isOwner ? (
            <li>
              <NavLink href="/tableau-de-bord">Tableau de bord</NavLink>
            </li>
          ) : null}
          {status === "anonymous" ? (
            <li>
              <NavLink href="/connexion">Connexion</NavLink>
            </li>
          ) : null}
          {status === "authenticated" && user ? (
            <>
              <li
                className="text-secondary hidden px-3 font-medium text-soft sm:block"
                aria-label="Utilisateur connecté"
              >
                {user.display_name}
              </li>
              <li>
                <button type="button" onClick={signOut}>
                  Déconnexion
                </button>
              </li>
            </>
          ) : null}
        </ul>
        {status === "anonymous" ? (
          <Link href="/inscription" className="btn btn-primary shrink-0">
            Inscription
          </Link>
        ) : null}
      </nav>
    </header>
  );
}
