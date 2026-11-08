import { Section } from "@/components/layout/Section";
import { DisplayTitle } from "@/components/layout/DisplayTitle";

const STEPS = [
  {
    number: "01",
    title: "Parcourez",
    text: "Une liste publique, rangée par catégories, avec le prix, la photo et un lien vers le produit.",
  },
  {
    number: "02",
    title: "Réservez",
    text: "Connectez-vous, réservez un cadeau en un clic. Il disparaît des disponibilités pour les autres.",
  },
  {
    number: "03",
    title: "Surprise gardée",
    text: "Le ou la propriétaire de la liste ne voit jamais ce qui est réservé, ni par qui.",
  },
];

export function HowItWorks() {
  return (
    <Section tone="band" aria-labelledby="comment-ca-marche">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="micro mb-4 text-ink-soft">Comment ça marche</p>
          <DisplayTitle as="h2" size="section" id="comment-ca-marche">
            Trois gestes
          </DisplayTitle>
        </div>
        <p className="max-w-sm text-sm text-ink-soft">
          Pas de doublon, pas de gêne : chaque cadeau n&apos;est réservé qu&apos;une fois.
        </p>
      </div>
      <ol className="grid gap-px bg-line md:grid-cols-3">
        {STEPS.map((step) => (
          <li key={step.number} className="flex flex-col gap-4 bg-surface-alt p-6 md:p-8">
            <p className="micro text-ink-soft">{step.number}</p>
            <h3 className="display display-card">{step.title}.</h3>
            <p className="text-sm leading-relaxed text-ink">{step.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
