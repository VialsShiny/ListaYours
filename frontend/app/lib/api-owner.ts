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

export function fetchOwnerData(token: string, signal?: AbortSignal): Promise<OwnerData> {
  return apiFetch<OwnerData>("/api/owner/wishlist", { token, signal });
}

export function patchWishlist(token: string, patch: WishlistPatch): Promise<OwnerWishlist> {
  return apiFetch<OwnerWishlist>("/api/owner/wishlist", { method: "PATCH", token, body: patch });
}

export function createCategory(token: string, name: string): Promise<Category> {
  return apiFetch<Category>("/api/owner/categories", { method: "POST", token, body: { name } });
}

export function renameCategory(token: string, id: Id, name: string): Promise<Category> {
  return apiFetch<Category>(`/api/owner/categories/${id}`, {
    method: "PATCH",
    token,
    body: { name },
  });
}

export function deleteCategory(token: string, id: Id): Promise<void> {
  return apiFetch<void>(`/api/owner/categories/${id}`, { method: "DELETE", token });
}

export function reorderCategories(token: string, ids: Id[]): Promise<Category[]> {
  return apiFetch<Category[]>("/api/owner/categories/reorder", {
    method: "PUT",
    token,
    body: { ids },
  });
}

export function createGift(token: string, payload: GiftPayload): Promise<OwnerGift> {
  return apiFetch<OwnerGift>("/api/owner/gifts", { method: "POST", token, body: payload });
}

export function updateGift(
  token: string,
  id: Id,
  payload: Partial<GiftPayload>,
): Promise<OwnerGift> {
  return apiFetch<OwnerGift>(`/api/owner/gifts/${id}`, { method: "PATCH", token, body: payload });
}

export function deleteGift(token: string, id: Id): Promise<void> {
  return apiFetch<void>(`/api/owner/gifts/${id}`, { method: "DELETE", token });
}

export function reorderGifts(token: string, ids: Id[]): Promise<OwnerGift[]> {
  return apiFetch<OwnerGift[]>("/api/owner/gifts/reorder", { method: "PUT", token, body: { ids } });
}

export function scrapeProduct(
  token: string,
  url: string,
  strategy: ScrapeStrategy,
  signal?: AbortSignal,
): Promise<ScrapeResponse> {
  return apiFetch<ScrapeResponse>("/api/scrape", {
    method: "POST",
    token,
    body: { url, strategy, debug: false },
    signal,
  });
}
