import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GiftDetailStage } from "@/components/wishlist/detail/GiftDetailStage";
import type { ViewerRole } from "@/components/wishlist/ReservationControl";
import { voice } from "@/content/voice";
import { detailHref, listHref, locateGift, siblingWindow } from "@/lib/gift-detail";
import type { PublicGift } from "@/lib/types";
import { groupGiftsByCategory } from "@/lib/wishlist-groups";
import { flattenGroups } from "@/lib/wishlist-navigation";

const base = {
  description: null,
  image_url: "https://example.test/p.jpg",
  price: "19.00",
  old_price: null,
  currency: "EUR",
  purchase_url: "https://example.test/p",
  is_reserved: false,
  reserved_by_me: false,
};

const gifts: PublicGift[] = [
  { ...base, id: 1, category_id: 10, name: "Bonnet", position: 0 },
  { ...base, id: 2, category_id: 10, name: "Écharpe", position: 1, is_reserved: true },
  { ...base, id: 3, category_id: 10, name: "Gants", position: 2 },
  { ...base, id: 4, category_id: 20, name: "Lampe", position: 0, old_price: "29.00" },
];
const categories = [
  { id: 10, name: "Hiver", position: 0 },
  { id: 20, name: "Maison", position: 1 },
];
const flat = flattenGroups(groupGiftsByCategory(categories, gifts, { dropEmpty: true }));
const RESERVATION_WORDS = /r[ée]serv|\bpris\b|\boffres?\b/i;

function render(viewer: ViewerRole, giftId = "2") {
  const position = locateGift(flat, giftId);
  if (!position) throw new Error("gift missing");
  return renderToStaticMarkup(
    createElement(GiftDetailStage, {
      slug: "noel",
      view: "grille",
      flat,
      position,
      direction: 0,
      viewer,
      loginHref: "/connexion",
      pending: false,
      onReserve: () => undefined,
      onCancel: () => undefined,
    }),
  );
}

describe("gift detail helpers", () => {
  it("locates a gift with sticky edges", () => {
    expect(locateGift(flat, "1")).toMatchObject({ index: 0, previous: null });
    expect(locateGift(flat, "2")?.previous?.gift.id).toBe(1);
    expect(locateGift(flat, "2")?.next?.gift.id).toBe(3);
    expect(locateGift(flat, "4")).toMatchObject({ index: 3, next: null });
    expect(locateGift(flat, "99")).toBeNull();
  });

  it("windows the siblings of the same category around the current gift", () => {
    expect(siblingWindow(flat, 1).map((item) => item.gift.id)).toEqual([1, 2, 3]);
    expect(siblingWindow(flat, 3).map((item) => item.gift.id)).toEqual([4]);
    expect(siblingWindow(flat, 0, 2).map((item) => item.gift.id)).toEqual([1, 2]);
    expect(siblingWindow(flat, 2, 2).map((item) => item.gift.id)).toEqual([2, 3]);
    expect(siblingWindow(flat, 9)).toEqual([]);
  });

  it("keeps the view mode in both directions of the route", () => {
    expect(detailHref("noel", 2, "grille")).toBe("/l/noel/c/2?vue=grille");
    expect(listHref("noel", "naviguer")).toBe("/l/noel?vue=naviguer");
  });
});

describe("gift detail stage", () => {
  it("never shows the owner a reservation state", () => {
    const html = render("owner");
    expect(html).not.toMatch(RESERVATION_WORDS);
    expect(html).not.toContain("data-muted");
    expect(html).toMatch(/gift-detail-actions"><a [^>]*>Voir le produit<\/a><\/div>/);
    expect(html).toContain("Écharpe");
    expect(html).toContain("02");
  });

  it("shows the visitor the taken state and the counter", () => {
    const html = render("visitor");
    expect(html).toContain('data-muted="true"');
    expect(html).toContain(voice.list.taken);
    expect(html).toContain("/l/noel/c/1?vue=grille");
    expect(html).toContain("/l/noel/c/3?vue=grille");
    expect(html).toContain('aria-current="page"');
  });

  it("offers the sign-in prompt to an anonymous visitor on a free gift", () => {
    const html = render("anonymous", "3");
    expect(html).toContain('href="/connexion"');
    expect(html).toContain(voice.list.reserve);
    expect(html).toContain(voice.detail.product);
  });
});
