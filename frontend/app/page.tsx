import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Section } from "@/components/layout/Section";
import { DisplayTitle } from "@/components/layout/DisplayTitle";
import { MicroLabel } from "@/components/layout/MicroLabel";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Section aria-labelledby="essentiels" className="pt-0">
        <div className="panel grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-end md:p-8">
          <div>
            <MicroLabel className="mb-3">Pour qui</MicroLabel>
            <DisplayTitle as="h2" size="section" id="essentiels">
              Les essentiels
            </DisplayTitle>
            <p className="text-secondary mt-4 max-w-prose text-soft">
              Un anniversaire, un mariage, une naissance : la personne qui reçoit compose sa liste,
              publie un lien, et ses proches se répartissent les cadeaux sans se croiser.
            </p>
          </div>
          <Link
            href="/connexion"
            className="btn btn-secondary justify-self-start md:justify-self-end"
          >
            Déjà un compte ? Connexion
          </Link>
        </div>
      </Section>
    </>
  );
}
