"use client";

import { useRef } from "react";
import Link from "next/link";
import { voice } from "@/content/voice";
import { DisplayTitle } from "@/components/layout/DisplayTitle";
import { MicroLabel } from "@/components/layout/MicroLabel";
import { SampleCard } from "@/components/landing/SampleCard";
import { useGhostParallax } from "@/hooks/use-ghost-parallax";
import { usePublicWishlists } from "@/hooks/use-public-wishlist";

const copy = voice.landing;

export function Hero() {
  const { data, loading, error } = usePublicWishlists();
  const first = data?.[0];
  const sectionRef = useRef<HTMLElement | null>(null);
  useGhostParallax(sectionRef);

  return (
    <section ref={sectionRef} className="relative overflow-hidden" aria-labelledby="hero-title">
      <p aria-hidden="true" className="ghost-word -top-4 right-[-6%] hidden lg:block">
        {copy.ghost}
      </p>
      <div className="container relative grid grid-cols-[minmax(0,1fr)] gap-10 pt-8 md:pt-14 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-12 xl:gap-16">
        <div className="flex min-w-0 flex-col gap-6 md:gap-9">
          <MicroLabel>{copy.eyebrow}</MicroLabel>
          <DisplayTitle size="hero" id="hero-title" className="tracking-[-0.05em]">
            {copy.title}
          </DisplayTitle>
          <p className="text-body max-w-[46ch] text-soft md:text-lead">{copy.lead}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {first ? (
              <Link href={`/l/${first.slug}`} className="btn btn-primary btn-hero">
                {copy.seeList}
              </Link>
            ) : (
              <span className="btn btn-primary btn-hero" aria-disabled="true">
                {copy.listSoon}
              </span>
            )}
            <Link href="/inscription" className="btn btn-secondary btn-hero">
              {copy.invited}
            </Link>
          </div>
          <p role="status" aria-live="polite" className="text-small min-h-5 text-soft">
            {loading ? copy.searching : null}
            {!loading && !first && !error ? copy.noList : null}
            {!loading && error ? copy.listError(error) : null}
          </p>
        </div>
        <SampleCard slug={first?.slug ?? null} className="max-w-[300px] lg:mt-16" />
      </div>
    </section>
  );
}
