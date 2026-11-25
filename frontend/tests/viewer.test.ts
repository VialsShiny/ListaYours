import { describe, expect, it } from "vitest";
import { resolveViewer } from "@/lib/viewer";

describe("resolveViewer", () => {
  it("maps the session to a viewer", () => {
    expect(resolveViewer({ status: "anonymous", isOwner: false, reservationsVisible: true })).toBe(
      "anonymous",
    );
    expect(
      resolveViewer({ status: "authenticated", isOwner: false, reservationsVisible: true }),
    ).toBe("visitor");
    expect(
      resolveViewer({ status: "authenticated", isOwner: true, reservationsVisible: true }),
    ).toBe("owner");
  });

  it("uses the owner view whenever the API masks reservations", () => {
    expect(
      resolveViewer({ status: "authenticated", isOwner: false, reservationsVisible: false }),
    ).toBe("owner");
    expect(resolveViewer({ status: "loading", isOwner: false, reservationsVisible: false })).toBe(
      "owner",
    );
    expect(
      resolveViewer({ status: "anonymous", isOwner: false, reservationsVisible: undefined }),
    ).toBe("anonymous");
  });
});
