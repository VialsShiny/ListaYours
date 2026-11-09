import Link from "next/link";
import { DisplayTitle } from "@/components/layout/DisplayTitle";
import { MicroLabel } from "@/components/layout/MicroLabel";
import { Section } from "@/components/layout/Section";

export default function NotFound() {
  return (
    <Section className="flex-1">
      <div className="panel p-6 md:p-8">
        <MicroLabel className="mb-3">Erreur 404</MicroLabel>
        <DisplayTitle size="section">Page introuvable</DisplayTitle>
        <p className="text-subhead mt-4 max-w-prose text-ink-soft">
          Cette adresse ne mène à aucune liste ni à aucune page connue.
        </p>
        <Link href="/" className="btn btn-secondary mt-6">
          Retour à l&apos;accueil
        </Link>
      </div>
    </Section>
  );
}
