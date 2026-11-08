import { describe, expect, it } from "vitest";
import {
  EMPTY_GIFT_FORM,
  giftFormToPayload,
  giftToFormValues,
  validateGiftForm,
} from "@/lib/gift-form";
import type { OwnerGift } from "@/lib/types";

const gift: OwnerGift = {
  id: 12,
  category_id: 3,
  name: "Carnet",
  description: null,
  image_url: null,
  price: "12.00",
  old_price: null,
  currency: "EUR",
  purchase_url: null,
  position: 0,
  is_visible: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("giftToFormValues", () => {
  it("turns nulls into empty strings and ids into strings", () => {
    expect(giftToFormValues(gift)).toEqual({
      name: "Carnet",
      description: "",
      image_url: "",
      price: "12.00",
      old_price: "",
      currency: "EUR",
      purchase_url: "",
      category_id: "3",
      is_visible: false,
    });
  });
});

describe("giftFormToPayload", () => {
  it("normalises prices, currency and blanks", () => {
    const payload = giftFormToPayload({
      ...EMPTY_GIFT_FORM,
      name: "  Carnet  ",
      price: "49,9",
      old_price: " ",
      currency: "usd",
      category_id: "3",
    });
    expect(payload).toEqual({
      name: "Carnet",
      description: null,
      image_url: null,
      price: "49.90",
      old_price: null,
      currency: "USD",
      purchase_url: null,
      category_id: 3,
      is_visible: true,
    });
  });

  it("sends null for the 'Aucune' category", () => {
    expect(giftFormToPayload(EMPTY_GIFT_FORM).category_id).toBeNull();
  });
});

describe("validateGiftForm", () => {
  it("requires a name and numeric prices", () => {
    expect(validateGiftForm(EMPTY_GIFT_FORM)).toMatch(/nom/i);
    expect(validateGiftForm({ ...EMPTY_GIFT_FORM, name: "X", price: "abc" })).toMatch(/prix/i);
    expect(validateGiftForm({ ...EMPTY_GIFT_FORM, name: "X", currency: "EURO" })).toMatch(
      /devise/i,
    );
    expect(validateGiftForm({ ...EMPTY_GIFT_FORM, name: "X", price: "10" })).toBeNull();
  });
});
