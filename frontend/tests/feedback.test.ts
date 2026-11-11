import { describe, expect, it, vi } from "vitest";
import { fireReservationConfetti } from "@/lib/confetti";
import { shouldMove } from "@/lib/motion";
import { sumReservations } from "@/lib/reservations-total";
import type { MyReservation } from "@/lib/types";

function item(id: number, price: string | null, currency = "EUR"): MyReservation {
  return {
    reservation: { id, gift_id: id, created_at: "2026-11-09T10:00:00Z" },
    wishlist: { title: "Liste", slug: "liste", description: null },
    gift: {
      id,
      category_id: null,
      name: `Cadeau ${id}`,
      description: null,
      image_url: null,
      price,
      old_price: null,
      currency,
      purchase_url: null,
      position: id,
      is_reserved: true,
      reserved_by_me: true,
    },
  };
}

describe("fireReservationConfetti", () => {
  it("never fires on the server", async () => {
    expect(await fireReservationConfetti()).toBe(false);
  });

  it("never fires under reduced motion", async () => {
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: true }),
    });
    try {
      expect(await fireReservationConfetti()).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("keyboard gating", () => {
  it("blocks confetti and other movement after a keyboard action", () => {
    expect(shouldMove(false, "keyboard")).toBe(false);
  });
});

describe("sumReservations", () => {
  it("returns the amount and currency used by the count-up", () => {
    expect(sumReservations([item(1, "199.00"), item(2, "0.50")])).toEqual({
      amount: 199.5,
      currency: "EUR",
    });
    expect(sumReservations([item(1, "10"), item(2, "10", "USD")])).toBeNull();
    expect(sumReservations([item(1, null)])).toBeNull();
  });
});
