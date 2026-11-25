import { apiFetch } from "@/lib/api";
import type {
  Category,
  GiftPayload,
  OwnerData,
  OwnerGift,
  OwnerWishlist,
  ScrapeResponse,
  ScrapeStrategy,
  WishlistPatch,
} from "@/lib/types";

type Id = number | string;
const session = true;

export function fetchOwnerData(signal?: AbortSignal): Promise<OwnerData> {
  return apiFetch<OwnerData>("/api/owner/wishlist", { session, signal });
}

export function patchWishlist(patch: WishlistPatch): Promise<OwnerWishlist> {
  return apiFetch<OwnerWishlist>("/api/owner/wishlist", { method: "PATCH", session, body: patch });
}

export function createCategory(name: string): Promise<Category> {
  return apiFetch<Category>("/api/owner/categories", { method: "POST", session, body: { name } });
}

export function renameCategory(id: Id, name: string): Promise<Category> {
  return apiFetch<Category>(`/api/owner/categories/${id}`, {
    method: "PATCH",
    session,
    body: { name },
  });
}

export function deleteCategory(id: Id): Promise<void> {
  return apiFetch<void>(`/api/owner/categories/${id}`, { method: "DELETE", session });
}

export function reorderCategories(ids: Id[]): Promise<Category[]> {
  return apiFetch<Category[]>("/api/owner/categories/reorder", {
    method: "PUT",
    session,
    body: { ids },
  });
}

export function createGift(payload: GiftPayload): Promise<OwnerGift> {
  return apiFetch<OwnerGift>("/api/owner/gifts", { method: "POST", session, body: payload });
}

export function updateGift(id: Id, payload: Partial<GiftPayload>): Promise<OwnerGift> {
  return apiFetch<OwnerGift>(`/api/owner/gifts/${id}`, { method: "PATCH", session, body: payload });
}

export function deleteGift(id: Id): Promise<void> {
  return apiFetch<void>(`/api/owner/gifts/${id}`, { method: "DELETE", session });
}

export function reorderGifts(ids: Id[]): Promise<OwnerGift[]> {
  return apiFetch<OwnerGift[]>("/api/owner/gifts/reorder", {
    method: "PUT",
    session,
    body: { ids },
  });
}

export function scrapeProduct(
  url: string,
  strategy: ScrapeStrategy,
  signal?: AbortSignal,
): Promise<ScrapeResponse> {
  return apiFetch<ScrapeResponse>("/api/scrape", {
    method: "POST",
    session,
    body: { url, strategy, debug: false },
    signal,
  });
}
