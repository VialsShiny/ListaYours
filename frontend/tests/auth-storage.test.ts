import { afterEach, describe, expect, it, vi } from "vitest";
import { USER_KEY, readUser } from "@/lib/auth-storage";

function withStored(value: unknown) {
  const store = new Map([[USER_KEY, JSON.stringify(value)]]);
  vi.stubGlobal("window", { localStorage: { getItem: (key: string) => store.get(key) ?? null } });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("readUser", () => {
  const user = { id: 1, email: "a@b.c", display_name: "A", has_avatar: false };

  it("returns a cached owner or visitor", () => {
    withStored({ ...user, role: "visitor" });
    expect(readUser()?.role).toBe("visitor");
    withStored({ ...user, role: "owner" });
    expect(readUser()?.role).toBe("owner");
  });

  it("ignores an unknown role", () => {
    withStored({ ...user, role: "admin" });
    expect(readUser()).toBeNull();
    withStored({ ...user });
    expect(readUser()).toBeNull();
  });
});
