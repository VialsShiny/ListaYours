const CURRENCY_PATTERN = /^[A-Z]{3}$/;

/**
 * Parses a price coming from the API ("199.00") or a form ("199,00") into a number.
 * Returns `null` when the value is empty or not numeric.
 */
export function parsePrice(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (normalized === "") return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Normalises a currency code to three uppercase letters, defaulting to EUR.
 */
export function normalizeCurrency(currency: string | null | undefined): string {
  const code = (currency ?? "").trim().toUpperCase();
  return CURRENCY_PATTERN.test(code) ? code : "EUR";
}

/**
 * Formats a price in French ("199,00 €"). Returns `null` for missing or invalid prices.
 */
export function formatPrice(
  value: string | number | null | undefined,
  currency: string | null | undefined = "EUR",
): string | null {
  const amount = parsePrice(value);
  if (amount === null) return null;
  const code = normalizeCurrency(currency);
  try {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: code }).format(amount);
  } catch {
    return `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2 }).format(amount)} ${code}`;
  }
}

/**
 * True when the old price is strictly greater than the current one.
 */
export function hasDiscount(
  price: string | number | null | undefined,
  oldPrice: string | number | null | undefined,
): boolean {
  const current = parsePrice(price);
  const previous = parsePrice(oldPrice);
  return current !== null && previous !== null && previous > current;
}

/**
 * Formats the "— 199,00 €" price line used on gift cards.
 */
export function formatPriceLine(
  value: string | number | null | undefined,
  currency: string | null | undefined = "EUR",
): string {
  const formatted = formatPrice(value, currency);
  return formatted ? `— ${formatted}` : "— Prix non renseigné";
}

/**
 * Formats a gift count on three digits ("007") for the rotated counter.
 */
export function formatCounter(count: number): string {
  if (!Number.isFinite(count) || count < 0) return "000";
  return String(Math.floor(count)).padStart(3, "0");
}

/**
 * Formats an ISO date in French ("8 novembre 2026").
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date);
}
