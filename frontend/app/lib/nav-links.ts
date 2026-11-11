import { voice } from "@/content/voice";

export type NavRole = "anonymous" | "visitor" | "owner";

export type NavLinkItem = { href: string; label: string };

export type NavModel = {
  links: NavLinkItem[];
  actions: NavLinkItem[];
  showSignOut: boolean;
};

/**
 * Header links and actions by role. `listHref` is the first published list, when known.
 */
export function buildNav(role: NavRole, listHref: string | null): NavModel {
  const links: NavLinkItem[] = [];
  if (listHref) links.push({ href: listHref, label: voice.nav.list });
  if (role === "anonymous") links.push({ href: "/#comment-ca-se-passe", label: voice.nav.how });
  if (role === "visitor") links.push({ href: "/mes-reservations", label: voice.nav.reservations });
  if (role === "owner") links.push({ href: "/tableau-de-bord", label: voice.nav.dashboard });

  const actions: NavLinkItem[] =
    role === "anonymous"
      ? [
          { href: "/connexion", label: voice.nav.login },
          { href: "/inscription", label: voice.nav.register },
        ]
      : [];

  return { links, actions, showSignOut: role !== "anonymous" };
}

/**
 * True when `href` designates the current page (exact match, or a prefix for nested routes).
 */
export function isActiveHref(href: string, pathname: string | null): boolean {
  if (!pathname) return false;
  const path = href.split("#")[0];
  if (path === "" || path === "/") return false;
  return pathname === path || pathname.startsWith(`${path}/`);
}
