import { describe, expect, it } from "vitest";
import { parseTheme, resolveTheme, THEME_BOOT_SCRIPT, THEME_KEY } from "@/lib/theme";

describe("theme resolution", () => {
  it("follows the system preference by default", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("keeps an explicit choice whatever the system says", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("treats an invalid stored value as system", () => {
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("blue")).toBe("system");
    expect(parseTheme(null)).toBe("system");
    expect(parseTheme(42)).toBe("system");
  });

  it("boots from the same storage key and only applies explicit values", () => {
    expect(THEME_BOOT_SCRIPT).toContain(THEME_KEY);
    expect(THEME_BOOT_SCRIPT).toContain('v==="light"||v==="dark"');
    expect(THEME_BOOT_SCRIPT).not.toContain("system");
  });
});
