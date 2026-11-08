import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Section } from "@/components/layout/Section";
import { DisplayTitle } from "@/components/layout/DisplayTitle";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Section tone="white" aria-labelledby="essentiels">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="micro mb-4 text-ink-soft">Pour qui</p>
            <DisplayTitle as="h2" size="section" id="essentiels">
              Les essentiels
            </DisplayTitle>
            <p className="mt-6 max-w-prose text-sm leading-relaxed text-ink">
              Un anniversaire, un mariage, une naissance : la personne qui reçoit compose sa liste,
              publie un lien, et ses proches se répartissent les cadeaux sans se croiser.
            </p>
          </div>
          <Link
            href="/connexion"
            className="link-arrow micro justify-self-start text-ink md:justify-self-end"
          >
            Déjà un compte ? Connexion
          </Link>
        </div>
      </Section>
    </>
  );
}
