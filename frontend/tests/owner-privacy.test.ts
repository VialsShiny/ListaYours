import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CategoryAccordion } from "@/components/wishlist/CategoryAccordion";
import { GiftCard } from "@/components/wishlist/GiftCard";
import { GiftGrid } from "@/components/wishlist/GiftGrid";
import { GiftNavigator } from "@/components/wishlist/GiftNavigator";
import type { ViewerRole } from "@/components/wishlist/ReservationControl";
import { voice } from "@/content/voice";
import type { PublicGift } from "@/lib/types";
import { groupGiftsByCategory } from "@/lib/wishlist-groups";

const gifts: PublicGift[] = [
  {
    id: 1,
    category_id: 10,
    name: "Moniteur AOC 27",
    description: "280 Hz",
    image_url: "https://example.test/aoc.jpg",
    price: "199.00",
    old_price: null,
    currency: "EUR",
    purchase_url: "https://example.test/aoc",
    position: 0,
    is_reserved: true,
    reserved_by_me: false,
  },
  {
    id: 2,
    category_id: 10,
    name: "Logitech StreamCam",
    description: null,
    image_url: null,
    price: "258.06",
    old_price: "299.00",
    currency: "EUR",
    purchase_url: null,
    position: 1,
    is_reserved: true,
    reserved_by_me: true,
  },
];

const categories = [{ id: 10, name: "Les essentiels", position: 0 }];
const groups = groupGiftsByCategory(categories, gifts, { dropEmpty: true });
const noop = () => undefined;
const RESERVATION_WORDS = /r[ée]serv|d[ée]j[àa] pris|pris|offres/i;

function render(viewer: ViewerRole) {
  const common = {
    viewer,
    loginHref: "/connexion",
    pendingId: null,
    onReserve: noop,
    onCancel: noop,
  };
  return {
    card: renderToStaticMarkup(
      createElement(GiftCard, { ...common, gift: gifts[0], pending: false }),
    ),
    grid: renderToStaticMarkup(createElement(GiftGrid, { ...common, label: "Cadeaux", gifts })),
    navigator: renderToStaticMarkup(createElement(GiftNavigator, { ...common, groups })),
    accordion: renderToStaticMarkup(
      createElement(CategoryAccordion, {
        groups,
        currentGiftId: 1,
        currentGroupKey: groups[0].key,
        viewer,
        onSelectGift: noop,
      }),
    ),
  };
}

describe("owner view never reveals reservations", () => {
  const owner = render("owner");

  it("renders no reservation text, attribute or control in the grid", () => {
    expect(owner.card).not.toMatch(RESERVATION_WORDS);
    expect(owner.card).not.toContain("data-reserved");
    expect(owner.card).not.toContain("<button");
    expect(owner.grid).not.toMatch(RESERVATION_WORDS);
    expect(owner.grid).not.toContain("data-reserved");
  });

  it("renders no reservation text in the navigator nor in the accordion", () => {
    expect(owner.navigator).not.toMatch(RESERVATION_WORDS);
    expect(owner.navigator).not.toContain("data-muted");
    expect(owner.accordion).not.toMatch(RESERVATION_WORDS);
    expect(owner.accordion).toContain("199,00");
  });
});

describe("visitor view shows the reservation states", () => {
  const visitor = render("visitor");

  it("marks the gift reserved by someone else and the one reserved by me", () => {
    expect(visitor.card).toContain('data-reserved="true"');
    expect(visitor.card).toContain(voice.list.taken);
    expect(visitor.grid).toContain(voice.list.mine.replaceAll("'", "&#x27;"));
    expect(visitor.grid).toContain(voice.list.cancel);
    expect(visitor.accordion).toContain(voice.list.reservedShort);
    expect(visitor.navigator).toContain(voice.list.taken);
    expect(visitor.navigator).toContain('data-muted="true"');
  });
});
