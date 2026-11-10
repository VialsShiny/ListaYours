"use client";

import { voice } from "@/content/voice";
import { AvatarForm } from "@/components/account/AvatarForm";
import { PasswordForm } from "@/components/account/PasswordForm";
import { ProfileForm } from "@/components/account/ProfileForm";
import { DashboardSectionTitle } from "@/components/dashboard/DashboardSectionTitle";
import type { User } from "@/lib/types";

type AccountPageProps = { user: User; token: string };

/**
 * Three independent sections, each with its own save and feedback.
 */
export function AccountPage({ user, token }: AccountPageProps) {
  const sections = [
    {
      id: "identite",
      index: "#01",
      title: voice.account.sections.profile,
      form: <ProfileForm user={user} token={token} />,
    },
    {
      id: "photo",
      index: "#02",
      title: voice.account.sections.photo,
      form: <AvatarForm user={user} token={token} />,
    },
    {
      id: "mot-de-passe",
      index: "#03",
      title: voice.account.sections.password,
      form: <PasswordForm token={token} />,
    },
  ];

  return (
    <div className="container flex flex-col gap-10 pt-10 md:gap-16 md:pt-14">
      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          aria-labelledby={`${section.id}-titre`}
          className="scroll-mt-6"
        >
          <DashboardSectionTitle
            id={`${section.id}-titre`}
            index={section.index}
            title={section.title}
          />
          {section.form}
        </section>
      ))}
    </div>
  );
}
