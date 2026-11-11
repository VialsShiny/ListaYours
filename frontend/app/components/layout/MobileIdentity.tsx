import Link from "next/link";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { voice } from "@/content/voice";
import { roleLabel } from "@/lib/identity";
import type { User } from "@/lib/types";

type MobileIdentityProps = {
  user: User;
  avatarUrl: string | null;
  onNavigate: () => void;
  onSignOut: () => void;
};

/**
 * Top of the phone menu: who is signed in, then the account link and the sign-out action.
 */
export function MobileIdentity({ user, avatarUrl, onNavigate, onSignOut }: MobileIdentityProps) {
  return (
    <div className="flex flex-col pt-5">
      <div className="identity-card">
        <UserAvatar name={user.display_name} src={avatarUrl} size="md" />
        <span className="identity-text">
          <span className="identity-name text-[17px]">{user.display_name}</span>
          <span className="identity-role">{roleLabel(user.role)}</span>
        </span>
      </div>
      <ul className="flex flex-col">
        <li className="hairline">
          <Link href="/parametres/compte" className="identity-entry" onClick={onNavigate}>
            {voice.nav.account}
            <span aria-hidden="true" className="text-accent">
              →
            </span>
          </Link>
        </li>
        <li className="hairline">
          <button type="button" className="identity-entry" onClick={onSignOut}>
            {voice.nav.signOut}
          </button>
        </li>
      </ul>
    </div>
  );
}
