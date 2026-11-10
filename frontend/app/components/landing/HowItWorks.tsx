"use client";

import { useRef } from "react";
import { Section } from "@/components/layout/Section";
import { DisplayTitle } from "@/components/layout/DisplayTitle";
import { useReveal } from "@/hooks/use-reveal";
import { LANDING_STEPS } from "@/lib/landing-steps";
import { cascadeStyle } from "@/lib/motion";

export function HowItWorks() {
  const listRef = useRef<HTMLOListElement | null>(null);
  useReveal(listRef);

  return (
    <Section aria-labelledby="comment-ca-marche" id="comment-ca-marche" className="scroll-mt-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-14">
        <DisplayTitle as="h2" size="section" id="comment-ca-marche-titre" className="min-w-0">
          Comment ça marche
        </DisplayTitle>
        <p className="text-secondary pb-2 text-soft">Trois étapes, aucune configuration.</p>
      </div>
      <ol ref={listRef} className="grid gap-8 md:grid-cols-3 md:gap-12">
        {LANDING_STEPS.map((step, index) => (
          <li
            key={step.number}
            className="reveal hairline flex flex-col gap-3 pt-5 md:pt-6"
            style={cascadeStyle(index)}
          >
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
