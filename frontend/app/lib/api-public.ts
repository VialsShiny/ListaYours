import { apiFetch } from "@/lib/api";
import type { MyReservation, PublicWishlist, Reservation, WishlistSummary } from "@/lib/types";

export function fetchPublicWishlists(signal?: AbortSignal): Promise<WishlistSummary[]> {
  return apiFetch<WishlistSummary[]>("/api/public/wishlists", { signal });
}

export function fetchPublicWishlist(slug: string, signal?: AbortSignal): Promise<PublicWishlist> {
  return apiFetch<PublicWishlist>(`/api/public/wishlists/${encodeURIComponent(slug)}`, { signal });
}

export function reserveGift(giftId: number | string): Promise<Reservation> {
  return apiFetch<Reservation>(`/api/gifts/${giftId}/reservation`, {
    method: "POST",
    session: true,
  });
}

export function cancelReservation(giftId: number | string): Promise<void> {
  return apiFetch<void>(`/api/gifts/${giftId}/reservation`, { method: "DELETE", session: true });
}

export function fetchMyReservations(signal?: AbortSignal): Promise<MyReservation[]> {
  return apiFetch<MyReservation[]>("/api/me/reservations", { session: true, signal });
}
