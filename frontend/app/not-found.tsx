import Link from "next/link";
import { DisplayTitle } from "@/components/layout/DisplayTitle";
import { MicroLabel } from "@/components/layout/MicroLabel";

export default function NotFound() {
  return (
    <section className="container flex flex-1 flex-col gap-7 pt-10 md:pt-16">
      <MicroLabel>Page introuvable</MicroLabel>
      <DisplayTitle
        size="hero"
        className="text-[clamp(7rem,30vw,18.75rem)] leading-[0.85] tracking-[-0.06em]"
      >
        404
      </DisplayTitle>
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
        <p className="text-body max-w-[34ch] text-soft md:text-lead">
          Cette page n&apos;existe pas, ou le lien a changé.
        </p>
        <Link href="/" className="btn btn-primary btn-hero self-start">
          Retour à l&apos;accueil
        </Link>
      </div>
    </section>
  );
}
