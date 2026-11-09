import { Section } from "@/components/layout/Section";
import { DisplayTitle } from "@/components/layout/DisplayTitle";
import { MicroLabel } from "@/components/layout/MicroLabel";
import { LANDING_STEPS } from "@/lib/landing-steps";

export function HowItWorks() {
  return (
    <Section aria-labelledby="comment-ca-marche">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <MicroLabel className="mb-3">Comment ça marche</MicroLabel>
          <DisplayTitle as="h2" size="section" id="comment-ca-marche">
            Trois gestes
          </DisplayTitle>
        </div>
        <p className="text-subhead max-w-sm text-ink-soft">
          Pas de doublon, pas de gêne : chaque cadeau n&apos;est réservé qu&apos;une fois.
        </p>
      </div>
      <ol className="grid gap-4 md:grid-cols-3">
        {LANDING_STEPS.map((step) => (
          <li key={step.number} className="panel flex flex-col gap-3 p-6">
            <p className="index-tag">{step.number}</p>
            <h3 className="title-card">{step.title}</h3>
            <p className="text-subhead text-ink-soft">{step.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
