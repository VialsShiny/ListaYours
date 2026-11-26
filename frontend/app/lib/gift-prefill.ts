import type { ProductData } from "@/lib/types";
import { normalizePriceInput, type GiftFormValues } from "@/lib/gift-form";
import { normalizeCurrency } from "@/lib/format";
import { safeHttpUrl } from "@/lib/safe-url";

function cleanText(value: string | null | undefined): string {
  return (value ?? "").trim();
}

/**
 * Distinct absolute http(s) image URLs of a scrape result, in order: the owner picks among them.
 */
export function imageCandidates(images: readonly string[] | null | undefined): string[] {
  const safe = (images ?? []).map(safeHttpUrl).filter((url): url is string => url !== null);
  return Array.from(new Set(safe));
}

/**
 * Picks the first usable http(s) image URL from the scraper result.
 */
export function firstImage(data: Pick<ProductData, "images" | "gallery">): string {
  return imageCandidates([...(data.images ?? []), ...(data.gallery ?? [])])[0] ?? "";
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
