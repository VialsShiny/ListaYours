"use client";

import { voice } from "@/content/voice";
import { AccountPage } from "@/components/account/AccountPage";
import { PageHero } from "@/components/layout/PageHero";
import { useRequireAuth } from "@/hooks/use-require-auth";

/**
 * Account route: anonymous readers are sent to the sign-in page by the shared guard.
 */
export function AccountView() {
  const { status, user, token } = useRequireAuth();
  const ready = status === "authenticated" && user !== null && token !== null;

  return (
    <>
      <PageHero eyebrow={voice.account.eyebrow} title={voice.account.title}>
        <p className="text-secondary mt-5 max-w-prose text-soft">{voice.account.intro}</p>
      </PageHero>
      {ready ? (
        <AccountPage user={user} token={token} />
      ) : (
        <section className="container flex-1 pt-10">
          <p className="text-secondary text-soft">
            {status === "anonymous" ? voice.reservations.redirect : voice.reservations.checking}
          </p>
        </section>
      )}
    </>
  );
}
