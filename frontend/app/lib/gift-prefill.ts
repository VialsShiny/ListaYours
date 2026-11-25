import type { ProductData } from "@/lib/types";
import { normalizePriceInput, type GiftFormValues } from "@/lib/gift-form";
import { normalizeCurrency } from "@/lib/format";
import { safeHttpUrl } from "@/lib/safe-url";

function cleanText(value: string | null | undefined): string {
  return (value ?? "").trim();
}

/**
 * Picks the first usable http(s) image URL from the scraper result.
 */
export function firstImage(data: Pick<ProductData, "images" | "gallery">): string {
  const candidates = [...(data.images ?? []), ...(data.gallery ?? [])];
  for (const candidate of candidates) {
    const url = safeHttpUrl(candidate);
    if (url) return url;
  }
  return "";
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
    safeHttpUrl(data.canonical_url) ?? safeHttpUrl(typedUrl) ?? safeHttpUrl(data.product_url);
  return {
    ...current,
    name: cleanText(data.title) || current.name,
    description: cleanText(data.description) || current.description,
    image_url: firstImage(data) || current.image_url,
    price: normalizePriceInput(data.price) ?? current.price,
    old_price: normalizePriceInput(data.old_price) ?? "",
    currency: normalizeCurrency(data.currency ?? current.currency),
    purchase_url: purchaseUrl ?? current.purchase_url,
  };
}
