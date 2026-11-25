import { describe, expect, it } from "vitest";
import { safeHttpUrl } from "@/lib/safe-url";

describe("safeHttpUrl", () => {
  it("keeps absolute http(s) URLs", () => {
    expect(safeHttpUrl("https://shop.example/p/1?ref=a")).toBe("https://shop.example/p/1?ref=a");
    expect(safeHttpUrl("  http://shop.example/p  ")).toBe("http://shop.example/p");
  });

  it("refuses other schemes, relative paths and non-strings", () => {
    for (const value of [
      "javascript:alert(1)",
      " JavaScript:alert(1)",
      "data:image/png;base64,xx",
      "vbscript:x",
      "/relative/path",
      "//shop.example/p",
      "",
      null,
      undefined,
      42,
    ]) {
      expect(safeHttpUrl(value)).toBeNull();
    }
  });
});
