import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GiftCard } from "@/components/wishlist/GiftCard";
import { voice } from "@/content/voice";
import type { PublicGift } from "@/lib/types";

const gift: PublicGift = {
  id: 1,
  category_id: null,
  name: "Lampe",
  description: null,
  image_url: "javascript:alert(1)",
  price: "10.00",
  old_price: null,
  currency: "EUR",
  purchase_url: "javascript:alert(1)",
  position: 0,
  is_reserved: false,
  reserved_by_me: false,
};

function renderCard(overrides: Partial<PublicGift>) {
  const noop = () => undefined;
  return renderToStaticMarkup(
    createElement(GiftCard, {
      gift: { ...gift, ...overrides },
      viewer: "anonymous",
      loginHref: "/connexion",
      pending: false,
      onReserve: noop,
      onCancel: noop,
    }),
  );
}

describe("gift links and photos", () => {
  it("renders no link and no image for javascript: URLs", () => {
    const html = renderCard({});
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<img");
    expect(html).not.toContain(voice.list.product);
    expect(html).not.toContain('target="_blank"');
  });

  it("renders http(s) links and images", () => {
    const html = renderCard({
      purchase_url: "https://shop.example/p/1",
      image_url: "https://cdn.example/p.jpg",
    });
    expect(html).toContain('href="https://shop.example/p/1"');
    expect(html).toContain(voice.list.product);
    expect(html).toContain('src="https://cdn.example/p.jpg"');
  });
});
