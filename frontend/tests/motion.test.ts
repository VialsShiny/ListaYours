import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MOTION, cascadeStyle, easeOut, prefersReducedMotion, shouldMove } from "@/lib/motion";

const read = (path: string) => readFileSync(new URL(`../app/${path}`, import.meta.url), "utf8");

describe("motion helpers", () => {
  it("never moves under reduced motion nor for keyboard actions", () => {
    expect(shouldMove(false, "pointer")).toBe(true);
    expect(shouldMove(true, "pointer")).toBe(false);
    expect(shouldMove(false, "keyboard")).toBe(false);
  });

  it("is safe to call on the server", () => {
    expect(prefersReducedMotion()).toBe(false);
  });

  it("caps the cascade index and eases out", () => {
    expect(cascadeStyle(3)).toEqual({ "--i": 3 });
    expect(cascadeStyle(40)).toEqual({ "--i": MOTION.cascadeMax });
    expect(easeOut(0)).toBe(0);
    expect(easeOut(1)).toBe(1);
    expect(easeOut(0.5)).toBeGreaterThan(0.5);
  });
});

describe("reduced motion in the stylesheets", () => {
  const tokens = read("theme/tokens.css");
  const base = read("theme/base.css");

  it("drops the movement multiplier to 0 instead of killing every transition", () => {
    expect(tokens).toMatch(/prefers-reduced-motion: reduce\)\s*\{\s*:root\s*\{\s*--move: 0;/);
    expect(base).not.toContain("transition-duration: 0.01ms");
  });

  it("drops UI movement for keyboard-driven changes", () => {
    expect(tokens).toMatch(/\[data-modality="keyboard"\]\s*\{\s*--move-ui: 0;/);
  });
});
