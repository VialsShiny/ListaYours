import { describe, expect, it } from "vitest";
import {
  firstIndexOfGroup,
  flattenGroups,
  formatIndex,
  formatPosition,
  stepIndex,
} from "@/lib/wishlist-navigation";
import { parseViewMode } from "@/hooks/use-view-mode";

const groups = [
  { key: "a", anchor: "cat-a", name: "A", gifts: [{ id: 1 }, { id: 2 }] },
  { key: "b", anchor: "cat-b", name: "B", gifts: [{ id: 3 }] },
];

describe("wishlist navigation helpers", () => {
  it("formats indexes and positions on two digits", () => {
    expect(formatIndex(0)).toBe("#01");
    expect(formatPosition(22)).toBe("23");
  });

  it("flattens groups in reading order and finds a category's first gift", () => {
    const flat = flattenGroups(groups);
    expect(flat.map((item) => item.gift.id)).toEqual([1, 2, 3]);
    expect(flat[2].groupName).toBe("B");
    expect(firstIndexOfGroup(flat, "b")).toBe(2);
    expect(firstIndexOfGroup(flat, "zz")).toBe(-1);
  });

  it("steps without wrapping around", () => {
    expect(stepIndex(0, -1, 3)).toBe(0);
    expect(stepIndex(2, 1, 3)).toBe(2);
    expect(stepIndex(1, 1, 3)).toBe(2);
    expect(stepIndex(5, 1, 0)).toBe(0);
  });

  it("defaults the view mode to naviguer", () => {
    expect(parseViewMode("grille")).toBe("grille");
    expect(parseViewMode("autre")).toBe("naviguer");
    expect(parseViewMode(null)).toBe("naviguer");
  });
});
