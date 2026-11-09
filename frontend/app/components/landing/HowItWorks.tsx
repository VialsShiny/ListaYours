import { Section } from "@/components/layout/Section";
import { DisplayTitle } from "@/components/layout/DisplayTitle";
import { LANDING_STEPS } from "@/lib/landing-steps";

export function HowItWorks() {
  return (
    <Section aria-labelledby="comment-ca-marche" id="comment-ca-marche" className="scroll-mt-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-14">
        <DisplayTitle as="h2" size="section" id="comment-ca-marche-titre" className="min-w-0">
          Comment ça marche
        </DisplayTitle>
        <p className="text-secondary pb-2 text-soft">Trois étapes, aucune configuration.</p>
      </div>
      <ol className="grid gap-8 md:grid-cols-3 md:gap-12">
        {LANDING_STEPS.map((step) => (
          <li key={step.number} className="hairline flex flex-col gap-3 pt-5 md:pt-6">
            <p className="index-tag text-[14px]">{step.number}</p>
            <h3 className="display-card text-[26px] leading-[1.1] tracking-[-0.02em] md:text-[30px]">
              {step.title}
            </h3>
            <p className="text-[16px] leading-[1.55] text-soft md:text-body">{step.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
