import type { GiftPayload, OwnerGift } from "@/lib/types";
import { normalizeCurrency } from "@/lib/format";

export type GiftFormValues = {
  name: string;
  description: string;
  image_url: string;
  price: string;
  old_price: string;
  currency: string;
  purchase_url: string;
  category_id: string;
  is_visible: boolean;
};

export const EMPTY_GIFT_FORM: GiftFormValues = {
  name: "",
  description: "",
  image_url: "",
  price: "",
  old_price: "",
  currency: "EUR",
  purchase_url: "",
  category_id: "",
  is_visible: true,
};

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizePriceInput(value: string): string | null {
  const trimmed = value.trim().replace(/\s/g, "").replace(",", ".");
  if (trimmed === "") return null;
  const amount = Number(trimmed);
  if (!Number.isFinite(amount)) return null;
  return amount.toFixed(2);
}

/**
 * Maps an existing owner gift to the editable form values.
 */
export function giftToFormValues(gift: OwnerGift): GiftFormValues {
  return {
    name: gift.name ?? "",
    description: gift.description ?? "",
    image_url: gift.image_url ?? "",
    price: gift.price ?? "",
    old_price: gift.old_price ?? "",
    currency: gift.currency ?? "EUR",
    purchase_url: gift.purchase_url ?? "",
    category_id:
      gift.category_id === null || gift.category_id === undefined ? "" : String(gift.category_id),
    is_visible: gift.is_visible ?? true,
  };
}

/**
 * Maps the form values to the `POST/PATCH /api/owner/gifts` payload:
 * blanks become `null`, prices are normalised to two decimals and the currency to ISO letters.
 */
export function giftFormToPayload(values: GiftFormValues): GiftPayload {
  const categoryId = values.category_id.trim();
  return {
    name: values.name.trim(),
    description: blankToNull(values.description),
    image_url: blankToNull(values.image_url),
    price: normalizePriceInput(values.price),
    old_price: normalizePriceInput(values.old_price),
    currency: normalizeCurrency(values.currency),
    purchase_url: blankToNull(values.purchase_url),
    category_id:
      categoryId === "" ? null : /^\d+$/.test(categoryId) ? Number(categoryId) : categoryId,
    is_visible: values.is_visible,
  };
}

/**
 * Returns a French validation message for the gift form, or `null` when the values are valid.
 */
export function validateGiftForm(values: GiftFormValues): string | null {
  if (values.name.trim() === "") return "Le nom du cadeau est obligatoire.";
  if (values.price.trim() !== "" && normalizePriceInput(values.price) === null) {
    return "Le prix doit être un nombre, par exemple 49,90.";
  }
  if (values.old_price.trim() !== "" && normalizePriceInput(values.old_price) === null) {
    return "L'ancien prix doit être un nombre, par exemple 59,90.";
  }
  if (values.currency.trim() !== "" && !/^[A-Za-z]{3}$/.test(values.currency.trim())) {
    return "La devise doit comporter trois lettres, par exemple EUR.";
  }
  return null;
}
