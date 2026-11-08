import { describe, expect, it } from "vitest";
import { groupGiftsByCategory, moveId, slugifyAnchor } from "@/lib/wishlist-groups";
import { sortByPosition, swapIds } from "@/lib/reorder";

const categories = [
  { id: 2, name: "Lecture", position: 1 },
  { id: 1, name: "Déco & lumière", position: 0 },
];

const gifts = [
  { id: "a", category_id: 2, position: 1 },
  { id: "b", category_id: 1, position: 0 },
  { id: "c", category_id: null, position: 2 },
  { id: "d", category_id: 99, position: 3 },
  { id: "e", category_id: 2, position: 0 },
];

describe("slugifyAnchor", () => {
  it("strips accents and punctuation", () => {
    expect(slugifyAnchor("Déco & lumière")).toBe("deco-lumiere");
    expect(slugifyAnchor("***", "x")).toBe("x");
  });
});

describe("groupGiftsByCategory", () => {
  it("orders categories and gifts by position and collects orphans in Autres", () => {
    const groups = groupGiftsByCategory(categories, gifts);
    expect(groups.map((group) => group.name)).toEqual(["Déco & lumière", "Lecture", "Autres"]);
    expect(groups[0].gifts.map((gift) => gift.id)).toEqual(["b"]);
    expect(groups[1].gifts.map((gift) => gift.id)).toEqual(["e", "a"]);
    expect(groups[2].gifts.map((gift) => gift.id)).toEqual(["c", "d"]);
    expect(groups[0].anchor).toBe("cat-deco-lumiere");
  });

  it("omits Autres when every gift has a category and can drop empty categories", () => {
    const groups = groupGiftsByCategory(categories, [{ id: "b", category_id: 1, position: 0 }], {
      dropEmpty: true,
    });
    expect(groups.map((group) => group.name)).toEqual(["Déco & lumière"]);
  });
});

describe("moveId / swapIds / sortByPosition", () => {
  const items = [{ id: 1 }, { id: 2 }, { id: 3 }];

  it("moves an item one step and refuses edge moves", () => {
    expect(moveId(items, 1, -1)).toEqual([2, 1, 3]);
    expect(moveId(items, 2, 1)).toBeNull();
    expect(moveId(items, 0, -1)).toBeNull();
  });

  it("swaps two ids anywhere in the global order", () => {
    expect(swapIds(items, 1, 3)).toEqual([3, 2, 1]);
    expect(swapIds(items, 1, 42)).toEqual([1, 2, 3]);
  });

  it("sorts by position", () => {
    expect(
      sortByPosition([
        { id: 1, position: 2 },
        { id: 2, position: 0 },
      ]).map((item) => item.id),
    ).toEqual([2, 1]);
  });
});
