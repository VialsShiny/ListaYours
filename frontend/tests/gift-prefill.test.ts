import { describe, expect, it } from "vitest";
import { EMPTY_GIFT_FORM } from "@/lib/gift-form";
import { firstImage, prefillGiftFromProduct } from "@/lib/gift-prefill";
import type { ProductData } from "@/lib/types";

const product: ProductData = {
  product_url: "https://shop.example/p/1?ref=abc",
  canonical_url: "https://shop.example/p/1",
  title: "  Lampe de chevet  ",
  price: "197.40",
  old_price: "249,00",
  discount: "-20%",
  currency: "eur",
  description: "Lampe en laiton brossé.",
  images: ["https://cdn.example/lampe.jpg", "https://cdn.example/lampe-2.jpg"],
  gallery: [],
  brand: "Atelier",
  sku: "LMP-1",
  availability: true,
  stock: null,
  category: "Maison",
  variants: { size: [], color: [], style: [], pattern: [] },
  characteristics: {},
  reviews: { rating_average: null, review_count: null, list: [] },
};

describe("firstImage", () => {
  it("returns the first http(s) image, falling back to the gallery", () => {
    expect(firstImage(product)).toBe("https://cdn.example/lampe.jpg");
    expect(
      firstImage({ images: ["data:image/png;base64,xx"], gallery: ["https://cdn.example/g.jpg"] }),
    ).toBe("https://cdn.example/g.jpg");
    expect(firstImage({ images: [], gallery: [] })).toBe("");
  });
});

describe("prefillGiftFromProduct", () => {
  it("maps the scraper fields onto the form", () => {
    const current = { ...EMPTY_GIFT_FORM, category_id: "3", is_visible: false };
    const result = prefillGiftFromProduct(product, "https://shop.example/p/1?ref=abc", current);
    expect(result).toEqual({
      ...current,
      name: "Lampe de chevet",
      description: "Lampe en laiton brossé.",
      image_url: "https://cdn.example/lampe.jpg",
      price: "197.40",
      old_price: "249.00",
      currency: "EUR",
      purchase_url: "https://shop.example/p/1",
    });
  });

  it("keeps the owner's category and visibility untouched", () => {
    const current = { ...EMPTY_GIFT_FORM, category_id: "7", is_visible: false };
    const result = prefillGiftFromProduct(product, "https://x.example", current);
    expect(result.category_id).toBe("7");
    expect(result.is_visible).toBe(false);
  });

  it("falls back to the typed URL and to EUR when the scraper has no canonical URL or currency", () => {
    const sparse: ProductData = {
      ...product,
      canonical_url: null,
      currency: null,
      title: null,
      images: [],
      price: null,
      old_price: null,
    };
    const result = prefillGiftFromProduct(sparse, "https://typed.example/item", EMPTY_GIFT_FORM);
    expect(result.purchase_url).toBe("https://typed.example/item");
    expect(result.currency).toBe("EUR");
    expect(result.name).toBe("");
    expect(result.image_url).toBe("");
    expect(result.price).toBe("");
    expect(result.old_price).toBe("");
  });
});
