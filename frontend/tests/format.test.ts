import { describe, expect, it } from "vitest";
import {
  formatCounter,
  formatPrice,
  formatPriceLine,
  hasDiscount,
  normalizeCurrency,
  parsePrice,
} from "@/lib/format";

const nbsp = (value: string) => value.replace(/[  ]/g, " ");

describe("parsePrice", () => {
  it("parses API strings and French decimals", () => {
    expect(parsePrice("199.00")).toBe(199);
    expect(parsePrice("49,90")).toBe(49.9);
    expect(parsePrice("1 299,00")).toBe(1299);
  });

  it("returns null for empty or invalid values", () => {
    expect(parsePrice(null)).toBeNull();
    expect(parsePrice("")).toBeNull();
    expect(parsePrice("abc")).toBeNull();
  });
});

describe("normalizeCurrency", () => {
  it("uppercases valid codes and falls back to EUR", () => {
    expect(normalizeCurrency("usd")).toBe("USD");
    expect(normalizeCurrency("€")).toBe("EUR");
    expect(normalizeCurrency(null)).toBe("EUR");
  });
});

describe("formatPrice", () => {
  it("formats in French with the euro sign", () => {
    expect(nbsp(formatPrice("199.00") ?? "")).toBe("199,00 €");
    expect(nbsp(formatPrice(1299.5, "EUR") ?? "")).toBe("1 299,50 €");
  });

  it("supports other currencies and returns null when missing", () => {
    expect(nbsp(formatPrice("10", "USD") ?? "")).toBe("10,00 $US");
    expect(formatPrice(null)).toBeNull();
  });
});

describe("hasDiscount", () => {
  it("is true only when the old price is strictly higher", () => {
    expect(hasDiscount("197.40", "249.00")).toBe(true);
    expect(hasDiscount("199.00", "199.00")).toBe(false);
    expect(hasDiscount("199.00", null)).toBe(false);
  });
});

describe("formatPriceLine / formatCounter", () => {
  it("prefixes with an em dash and handles missing prices", () => {
    expect(nbsp(formatPriceLine("199.00"))).toBe("— 199,00 €");
    expect(formatPriceLine(null)).toBe("— Prix non renseigné");
  });

  it("pads the counter on three digits", () => {
    expect(formatCounter(7)).toBe("007");
    expect(formatCounter(123)).toBe("123");
    expect(formatCounter(-1)).toBe("000");
  });
});
