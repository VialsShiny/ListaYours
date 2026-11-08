import { apiFetch } from "@/lib/api";
import type { MyReservation, PublicWishlist, Reservation, WishlistSummary } from "@/lib/types";

export function fetchPublicWishlists(signal?: AbortSignal): Promise<WishlistSummary[]> {
  return apiFetch<WishlistSummary[]>("/api/public/wishlists", { signal });
}

export function fetchPublicWishlist(
  slug: string,
  token: string | null,
  signal?: AbortSignal,
): Promise<PublicWishlist> {
  return apiFetch<PublicWishlist>(`/api/public/wishlists/${encodeURIComponent(slug)}`, {
    token,
    signal,
  });
}

export function reserveGift(giftId: number | string, token: string): Promise<Reservation> {
  return apiFetch<Reservation>(`/api/gifts/${giftId}/reservation`, { method: "POST", token });
}

export function cancelReservation(giftId: number | string, token: string): Promise<void> {
  return apiFetch<void>(`/api/gifts/${giftId}/reservation`, { method: "DELETE", token });
}

export function fetchMyReservations(token: string, signal?: AbortSignal): Promise<MyReservation[]> {
  return apiFetch<MyReservation[]>("/api/me/reservations", { token, signal });
}
