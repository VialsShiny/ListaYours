"use client";

import Link from "next/link";
import { voice } from "@/content/voice";
import { usePathname } from "next/navigation";
import { IdentityMenu } from "@/components/layout/IdentityMenu";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { useAuth } from "@/hooks/use-auth";
import { useAvatarUrl } from "@/hooks/use-avatar-url";
import { usePublicWishlists } from "@/hooks/use-public-wishlist";
import { buildNav, isActiveHref, type NavRole } from "@/lib/nav-links";

export function SiteHeader() {
  const { status, user, token, isOwner, signOut } = useAuth();
  const avatarUrl = useAvatarUrl(user, token);
  const pathname = usePathname();
  const wishlists = usePublicWishlists();
  const firstSlug = wishlists.data?.[0]?.slug;
  const role: NavRole = isOwner ? "owner" : status === "authenticated" ? "visitor" : "anonymous";
  const nav = buildNav(role, firstSlug ? `/l/${firstSlug}` : null);

  return (
    <div className="nav-wrap">
      <header className="nav container">
        <Link href="/" className="wordmark inline-flex min-h-11 shrink-0 items-center">
          {voice.brand}
        </Link>
        <nav aria-label={voice.nav.navLabel} className="hidden min-w-0 md:block">
          <ul className="nav-links">
            {nav.links.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActiveHref(item.href, pathname) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="nav-actions hidden md:flex">
          {nav.actions.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                index === nav.actions.length - 1 ? "btn btn-primary btn-sm" : "btn btn-text"
              }
            >
              {item.label}
            </Link>
          ))}
          {nav.showSignOut && user ? (
            <IdentityMenu user={user} avatarUrl={avatarUrl} onSignOut={signOut} />
          ) : null}
        </div>
        <MobileMenu
          nav={nav}
          pathname={pathname}
          user={nav.showSignOut ? user : null}
          avatarUrl={avatarUrl}
          onSignOut={signOut}
        />
      </header>
    </div>
  );
}
