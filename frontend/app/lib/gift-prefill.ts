import type { ProductData } from "@/lib/types";
import type { GiftFormValues } from "@/lib/gift-form";
import { normalizeCurrency } from "@/lib/format";

function cleanText(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function cleanPrice(value: string | null | undefined): string {
  const trimmed = cleanText(value).replace(/\s/g, "").replace(",", ".");
  if (trimmed === "") return "";
  const amount = Number(trimmed);
  return Number.isFinite(amount) ? amount.toFixed(2) : "";
}

/**
 * Picks the first usable http(s) image URL from the scraper result.
 */
export function firstImage(data: Pick<ProductData, "images" | "gallery">): string {
  const candidates = [...(data.images ?? []), ...(data.gallery ?? [])];
  const found = candidates.find((url) => typeof url === "string" && /^https?:\/\//i.test(url));
  return found ?? "";
}

/**
 * Maps a scraper `ProductData` onto the gift form, keeping the owner's current
 * category and visibility choices untouched.
 */
export function prefillGiftFromProduct(
  data: ProductData,
  typedUrl: string,
  current: GiftFormValues,
): GiftFormValues {
  const purchaseUrl =
    cleanText(data.canonical_url) || cleanText(typedUrl) || cleanText(data.product_url);
  return {
    ...current,
    name: cleanText(data.title) || current.name,
    description: cleanText(data.description) || current.description,
    image_url: firstImage(data) || current.image_url,
    price: cleanPrice(data.price) || current.price,
    old_price: cleanPrice(data.old_price),
    currency: normalizeCurrency(data.currency ?? current.currency),
    purchase_url: purchaseUrl || current.purchase_url,
  };
}
