import Link from "next/link";
import { voice } from "@/content/voice";
import { DisplayTitle } from "@/components/layout/DisplayTitle";
import { MicroLabel } from "@/components/layout/MicroLabel";

export default function NotFound() {
  return (
    <section className="title-column container flex flex-1 flex-col gap-7 pt-10 md:pt-16">
      <MicroLabel>{voice.notFound.eyebrow}</MicroLabel>
      <DisplayTitle
        size="hero"
        className="text-[clamp(4rem,23cqw,18.75rem)] leading-[0.85] tracking-[-0.06em]"
      >
        {voice.notFound.title}
      </DisplayTitle>
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
        <p className="text-body max-w-[34ch] text-soft md:text-lead">{voice.notFound.text}</p>
        <Link href="/" className="btn btn-primary btn-hero self-start">
          {voice.notFound.back}
        </Link>
      </div>
    </section>
  );
}
