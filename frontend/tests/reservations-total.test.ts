import { describe, expect, it } from "vitest";
import { formatReservationsTotal } from "@/lib/reservations-total";
import type { MyReservation } from "@/lib/types";

function item(id: number, price: string | null): MyReservation {
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
      currency: "EUR",
      purchase_url: null,
      position: id,
      is_reserved: true,
      reserved_by_me: true,
    },
  };
}

describe("formatReservationsTotal", () => {
  it("sums the priced gifts and formats in French", () => {
    const total = formatReservationsTotal([item(1, "199.00"), item(2, "106.68"), item(3, null)]);
    expect(total?.replace(/\s/g, " ")).toBe("305,68 €");
  });

  it("returns null when the priced gifts mix currencies", () => {
    const usd = item(2, "10.00");
    usd.gift.currency = "USD";
    expect(formatReservationsTotal([item(1, "199.00"), usd])).toBeNull();
  });

  it("returns null when nothing has a price", () => {
    expect(formatReservationsTotal([item(1, null)])).toBeNull();
    expect(formatReservationsTotal([])).toBeNull();
  });
});
