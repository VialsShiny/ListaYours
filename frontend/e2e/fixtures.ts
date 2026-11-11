import type { Page } from "@playwright/test";

export type Role = "anonymous" | "visitor" | "owner";

const PIXEL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="4" height="5"/>');

const WISHLIST = { title: "Mes envies", slug: "noel", description: "Pour Noël, sans pression." };

const CATEGORIES = [
  { id: 1, name: "Maison et cuisine", position: 0 },
  { id: 2, name: "Électroménager", position: 1 },
  { id: 3, name: "Vêtements", position: 2 },
];

const GIFT_NAMES = [
  "Machine à espresso De'Longhi Dedica",
  "Casque Sony WH-1000XM5 argent",
  "Moniteur AOC 27 pouces 280 Hz",
  "Logitech StreamCam",
  "Manteau en laine bouillie camel",
  "Chaussures New Balance 740",
  "Lampe de bureau articulée",
  "Clavier mécanique compact",
];

const GIFTS = GIFT_NAMES.map((name, index) => ({
  id: index + 1,
  category_id: CATEGORIES[index % 3].id,
  name,
  description: index % 2 === 0 ? "Taille M ou L, couleur au choix si possible." : null,
  image_url: index % 3 === 0 ? null : PIXEL,
  price: index === 1 ? null : `${49 + index * 37}.90`,
  old_price: index === 3 ? "299.00" : null,
  currency: "EUR",
  purchase_url: "https://example.test/produit",
  position: index,
  is_reserved: index === 2 || index === 5,
  reserved_by_me: index === 5,
  is_visible: true,
  created_at: "2026-11-01T10:00:00Z",
  updated_at: "2026-11-01T10:00:00Z",
}));

const NO_PHOTO = { has_avatar: false, avatar_updated_at: null };

const USERS = {
  visitor: {
    id: 2,
    email: "visiteur@example.test",
    display_name: "Camille",
    role: "visitor",
    ...NO_PHOTO,
  },
  owner: { id: 1, email: "owner@example.test", display_name: "Moi", role: "owner", ...NO_PHOTO },
};

export type Identity = { displayName?: string; avatar?: boolean };

const AVATAR_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#cf3328"/></svg>';

/**
 * The fixture user for a role, with an optional long pseudo and picture flag.
 */
export function userFor(role: Exclude<Role, "anonymous">, identity: Identity = {}) {
  return {
    ...USERS[role],
    display_name: identity.displayName ?? USERS[role].display_name,
    has_avatar: Boolean(identity.avatar),
    avatar_updated_at: identity.avatar ? "2026-11-11T10:00:00Z" : null,
  };
}

const RESERVATIONS = [2, 5].map((giftId, index) => ({
  reservation: { id: index + 1, gift_id: giftId, created_at: "2026-11-02T10:00:00Z" },
  gift: GIFTS[giftId - 1],
  wishlist: WISHLIST,
}));

const OWNER_WISHLIST = {
  id: 1,
  ...WISHLIST,
  is_published: true,
  created_at: "2026-10-01T10:00:00Z",
  updated_at: "2026-11-01T10:00:00Z",
};

/**
 * Answers every `/api/**` call with fixture data so the pages render without the API.
 */
export async function mockApi(page: Page, role: Role, identity: Identity = {}): Promise<void> {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

    if (path === "/api/public/wishlists") return json([WISHLIST]);
    if (path.startsWith("/api/public/wishlists/")) {
      const gifts = GIFTS.map((gift) =>
        role === "owner" ? { ...gift, is_reserved: false, reserved_by_me: false } : gift,
      );
      return json({
        wishlist: WISHLIST,
        categories: CATEGORIES,
        gifts,
        reservations_visible: true,
      });
    }
    if (path === "/api/auth/me" || path === "/api/account") {
      return role === "anonymous"
        ? json({ detail: "Non authentifié" }, 401)
        : json(userFor(role, identity));
    }
    if (path === "/api/account/avatar") {
      if (role === "anonymous") return json({ detail: "Non authentifié" }, 401);
      if (!identity.avatar) return json({ detail: "Pas de photo pour ce compte." }, 404);
      return route.fulfill({ status: 200, contentType: "image/svg+xml", body: AVATAR_SVG });
    }
    if (path === "/api/me/reservations") return json(role === "visitor" ? RESERVATIONS : []);
    if (path === "/api/owner/wishlist") {
      const gifts = GIFTS.map(({ is_reserved: _r, reserved_by_me: _m, ...gift }) => gift);
      return json({ wishlist: OWNER_WISHLIST, categories: CATEGORIES, gifts });
    }
    return json({ detail: "Mock sans réponse pour cette route" }, 404);
  });
}

/**
 * Stores a fake session before the first script runs, the way the app does after a login.
 */
export async function signInAs(page: Page, role: Role, identity: Identity = {}): Promise<void> {
  if (role === "anonymous") return;
  await page.addInitScript(
    ([token, user]) => {
      window.localStorage.setItem("listayours.token", token);
      window.localStorage.setItem("listayours.user", user);
    },
    [`e2e-${role}-token`, JSON.stringify(userFor(role, identity))] as const,
  );
}

/**
 * Waits for fonts and for the mocked data to have replaced every skeleton.
 */
export async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => document.fonts.status === "loaded");
  await page.waitForFunction(
    () => !document.querySelector('[aria-busy="true"], .skeleton'),
    undefined,
    { timeout: 20_000 },
  );
}
