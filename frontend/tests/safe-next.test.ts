import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/safe-next";

describe("safeNextPath", () => {
  it("falls back on missing values", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath(undefined)).toBe("/");
    expect(safeNextPath("")).toBe("/");
    expect(safeNextPath("", "/mes-reservations")).toBe("/mes-reservations");
  });

  it("refuses anything that could leave the site", () => {
    for (const value of [
      "//evil.example",
      "/\\evil.example",
      "/\t/evil.example",
      "/\n/evil.example",
      "javascript:alert(1)",
      "https://evil.example",
    ]) {
      expect(safeNextPath(value)).toBe("/");
    }
  });

  it("keeps same-origin paths with their query and fragment", () => {
    expect(safeNextPath("/l/slug?vue=grille#x")).toBe("/l/slug?vue=grille#x");
    expect(safeNextPath("/l/noel")).toBe("/l/noel");
  });
});
