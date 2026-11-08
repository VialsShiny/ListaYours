"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { usePublicWishlists } from "@/hooks/use-public-wishlist";
import { cn } from "@/lib/utils";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "micro px-1 py-2 text-ink underline-offset-4 hover:underline",
        active && "underline",
      )}
    >
      {children}
    </Link>
  );
}

export function SiteHeader() {
  const { status, user, isOwner, signOut } = useAuth();
  const wishlists = usePublicWishlists();
  const firstSlug = wishlists.data?.[0]?.slug;

  return (
    <header className="hairline-frame border-x-0 border-t-0 px-4 py-5 md:px-12 md:py-6 lg:px-16">
      <nav
        aria-label="Navigation principale"
        className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3"
      >
        <Link href="/" className="display text-2xl leading-none md:text-3xl">
          ListaYours.
        </Link>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
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
          {status === "authenticated" && user ? (
            <>
              <li className="micro hidden text-ink-soft sm:block" aria-label="Utilisateur connecté">
                {user.display_name}
              </li>
              <li>
                <button
                  type="button"
                  onClick={signOut}
                  className="micro cursor-pointer px-1 py-2 text-ink underline-offset-4 hover:underline"
                >
                  Déconnexion
                </button>
              </li>
            </>
          ) : null}
          {status === "anonymous" ? (
            <>
              <li>
                <NavLink href="/connexion">Connexion</NavLink>
              </li>
              <li>
                <NavLink href="/inscription">Inscription</NavLink>
              </li>
            </>
          ) : null}
        </ul>
      </nav>
    </header>
  );
}
