"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { voice } from "@/content/voice";
import { Dialog } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import { MobileIdentity } from "@/components/layout/MobileIdentity";
import { isActiveHref, type NavModel } from "@/lib/nav-links";
import type { User } from "@/lib/types";

type MobileMenuProps = {
  nav: NavModel;
  pathname: string | null;
  user: User | null;
  avatarUrl: string | null;
  onSignOut: () => void;
};

/**
 * Full-screen menu under 768px: the signed-in identity on top, large links separated by hairlines,
 * sign-in actions at the bottom for anonymous readers.
 * Base UI's Dialog provides the focus trap, Escape and scroll lock; the menu closes on navigation.
 */
export function MobileMenu({ nav, pathname, user, avatarUrl, onSignOut }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="btn btn-primary btn-sm md:hidden" aria-label={voice.nav.openMenu}>
        {voice.nav.menu}
        <Menu className="size-4" aria-hidden="true" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Popup className="ly-menu-popup md:hidden" aria-label={voice.nav.menuLabel}>
          <div className="nav">
            <span className="wordmark">{voice.brand}</span>
            <Dialog.Close className="btn btn-sm" aria-label={voice.nav.closeMenu}>
              {voice.nav.close}
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
          </div>
          {user ? (
            <MobileIdentity
              user={user}
              avatarUrl={avatarUrl}
              onNavigate={() => setOpen(false)}
              onSignOut={() => {
                setOpen(false);
                onSignOut();
              }}
            />
          ) : null}
          <nav aria-label={voice.nav.navLabel} className="flex flex-1 flex-col px-1 pt-6">
            <ul className="flex flex-col">
              {nav.links.map((item) => (
                <li key={item.href} className="hairline">
                  <Link
                    href={item.href}
                    aria-current={isActiveHref(item.href, pathname) ? "page" : undefined}
                    className="flex min-h-[84px] items-center justify-between gap-4"
                    onClick={() => setOpen(false)}
                  >
                    <span className="display min-w-0 text-[clamp(1.75rem,8.5vw,2.75rem)] tracking-[-0.045em]">
                      {item.label}
                    </span>
                    <span aria-hidden="true" className="text-[22px] text-accent">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex flex-col gap-3 pt-6">
            {nav.actions.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  index === nav.actions.length - 1
                    ? "btn btn-primary btn-hero"
                    : "btn btn-secondary btn-hero"
                }
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
