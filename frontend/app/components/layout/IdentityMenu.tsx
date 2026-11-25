"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import { ChevronDown } from "lucide-react";
import { ThemeMenuGroup } from "@/components/layout/ThemeMenuGroup";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { voice } from "@/content/voice";
import { roleLabel } from "@/lib/identity";
import type { User } from "@/lib/types";

type IdentityMenuProps = {
  user: User;
  avatarUrl: string | null;
  onSignOut: () => void;
};

/**
 * Desktop header identity: avatar, pseudo and role in a pill that opens a two-entry menu.
 * The menu closes on navigation, since the account link is a client-side route change.
 */
export function IdentityMenu({ user, avatarUrl, onSignOut }: IdentityMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Menu.Root modal={false} open={open} onOpenChange={setOpen}>
      <Menu.Trigger className="identity-trigger">
        <UserAvatar name={user.display_name} src={avatarUrl} size="sm" />
        <span className="identity-text">
          <span className="identity-name">{user.display_name}</span>
          <span className="identity-role">{roleLabel(user.role)}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-soft" aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={8} className="identity-positioner">
          <Menu.Popup className="identity-popup" aria-label={voice.nav.accountMenu}>
            <Menu.LinkItem
              render={<Link href="/parametres/compte" />}
              className="identity-item"
              closeOnClick
              onClick={() => setOpen(false)}
            >
              {voice.nav.account}
            </Menu.LinkItem>
            <Menu.Item className="identity-item" onClick={onSignOut}>
              {voice.nav.signOut}
            </Menu.Item>
            <ThemeMenuGroup />
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
