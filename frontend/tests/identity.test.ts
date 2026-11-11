import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IdentityMenu } from "@/components/layout/IdentityMenu";
import { MobileIdentity } from "@/components/layout/MobileIdentity";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { voice } from "@/content/voice";
import { AVATAR_MAX_BYTES, checkAvatarFile } from "@/lib/avatar-file";
import { initialOf, roleLabel } from "@/lib/identity";
import type { User } from "@/lib/types";

const RESERVATION_WORDS = /r[ée]serv|\bpris\b|\boffres?\b/i;
const noop = () => undefined;

const visitor: User = {
  id: 2,
  email: "camille@example.test",
  display_name: "Jean-Baptiste-Alexandre-Montmorency",
  role: "visitor",
  has_avatar: false,
  avatar_updated_at: null,
};

const owner: User = { ...visitor, id: 1, display_name: "a", role: "owner" };

describe("identity helpers", () => {
  it("maps the two roles to French labels", () => {
    expect(roleLabel("owner")).toBe("Propriétaire");
    expect(roleLabel("visitor")).toBe("Invité(e)");
    expect(roleLabel("anything-else")).toBe("Invité(e)");
  });

  it("takes the upper-cased first character of the pseudo", () => {
    expect(initialOf("camille")).toBe("C");
    expect(initialOf("  éric")).toBe("É");
    expect(initialOf("a")).toBe("A");
    expect(initialOf("   ")).toBe("?");
  });

  it("checks the picked file like the API does", () => {
    expect(checkAvatarFile({ type: "image/png", size: 10 })).toBeNull();
    expect(checkAvatarFile({ type: "image/webp", size: AVATAR_MAX_BYTES })).toBeNull();
    expect(checkAvatarFile({ type: "image/gif", size: 10 })).toBe(voice.account.photo.wrongType);
    expect(checkAvatarFile({ type: "text/html", size: 10 })).toBe(voice.account.photo.wrongType);
    expect(checkAvatarFile({ type: "image/jpeg", size: AVATAR_MAX_BYTES + 1 })).toBe(
      voice.account.photo.tooHeavy,
    );
  });
});

describe("UserAvatar", () => {
  it("shows the initial on the tile when there is no picture", () => {
    const html = renderToStaticMarkup(createElement(UserAvatar, { name: "camille", src: null }));
    expect(html).toContain(">C<");
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("<img");
  });

  it("shows the picture with an accessible name when described", () => {
    const html = renderToStaticMarkup(
      createElement(UserAvatar, { name: "Camille", src: "blob:x", size: "xl", described: true }),
    );
    expect(html).toContain('<img src="blob:x" alt="Photo de Camille"');
    expect(html).toContain("avatar-xl");
  });
});

describe("header identity", () => {
  it("renders the pseudo and the role in the desktop menu trigger", () => {
    const html = renderToStaticMarkup(
      createElement(IdentityMenu, { user: visitor, avatarUrl: null, onSignOut: noop }),
    );
    expect(html).toContain(visitor.display_name);
    expect(html).toContain("Invité(e)");
    expect(html).toContain('class="identity-trigger"');
    expect(html).not.toMatch(RESERVATION_WORDS);
  });

  it("renders the owner label and the two entries in the phone menu", () => {
    const html = renderToStaticMarkup(
      createElement(MobileIdentity, {
        user: owner,
        avatarUrl: null,
        onNavigate: noop,
        onSignOut: noop,
      }),
    );
    expect(html).toContain("Propriétaire");
    expect(html).toContain('href="/parametres/compte"');
    expect(html).toContain(voice.nav.account);
    expect(html).toContain(voice.nav.signOut);
    expect(html).not.toMatch(RESERVATION_WORDS);
  });
});
