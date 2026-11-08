import Link from "next/link";
import { DisplayTitle } from "@/components/layout/DisplayTitle";
import { MicroLabel } from "@/components/layout/MicroLabel";
import { Section } from "@/components/layout/Section";

export default function NotFound() {
  return (
    <Section tone="white" className="flex-1">
      <MicroLabel className="mb-6">Erreur 404</MicroLabel>
      <DisplayTitle size="section">Page introuvable</DisplayTitle>
      <p className="mt-6 max-w-prose text-sm text-ink-soft">
        Cette adresse ne mène à aucune liste ni à aucune page connue.
      </p>
      <Link href="/" className="link-arrow micro mt-8 inline-block text-ink">
        Retour à l&apos;accueil
      </Link>
    </Section>
  );
}
