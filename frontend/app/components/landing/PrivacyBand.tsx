import { DisplayTitle } from "@/components/layout/DisplayTitle";

/**
 * Ink band stating the privacy promise, with the accent-on-dark period.
 */
export function PrivacyBand() {
  return (
    <section className="container" aria-labelledby="promesse-titre">
      <div className="ink-band on-ink flex flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between md:gap-12 md:px-16 md:py-14">
        <DisplayTitle
          as="h2"
          size="sub"
          id="promesse-titre"
          className="max-w-[620px] text-[32px] leading-[1.05] tracking-[-0.035em] md:text-[48px]"
        >
          Vous ne voyez jamais ce qui est réservé
        </DisplayTitle>
        <p className="text-secondary max-w-[36ch] leading-[1.55] text-on-ink-soft md:text-body">
          L&apos;information n&apos;est jamais envoyée au propriétaire, ni dans la page, ni dans
          l&apos;API. Ce n&apos;est pas un simple masquage.
        </p>
      </div>
    </section>
  );
}
