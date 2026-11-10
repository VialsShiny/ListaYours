import { describe, expect, it } from "vitest";
import { buildNav, isActiveHref } from "@/lib/nav-links";

describe("buildNav", () => {
  it("offers sign in and sign up to anonymous visitors", () => {
    const nav = buildNav("anonymous", "/l/noel");
    expect(nav.links.map((item) => item.label)).toEqual(["La liste", "Comment ça se passe"]);
    expect(nav.actions.map((item) => item.href)).toEqual(["/connexion", "/inscription"]);
    expect(nav.showSignOut).toBe(false);
  });

  it("shows the reservations page to visitors and the dashboard to the owner", () => {
    expect(buildNav("visitor", null).links.map((item) => item.href)).toEqual(["/mes-reservations"]);
    expect(buildNav("owner", null).links.map((item) => item.href)).toEqual(["/tableau-de-bord"]);
    expect(buildNav("owner", null).showSignOut).toBe(true);
  });
});

describe("isActiveHref", () => {
  it("matches exact and nested paths but never the home anchor", () => {
    expect(isActiveHref("/l/noel", "/l/noel")).toBe(true);
    expect(isActiveHref("/tableau-de-bord", "/tableau-de-bord/x")).toBe(true);
    expect(isActiveHref("/#comment-ca-se-passe", "/")).toBe(false);
    expect(isActiveHref("/l/noel", null)).toBe(false);
  });
});
