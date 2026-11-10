import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { DisplayTitle } from "@/components/layout/DisplayTitle";
import { MicroLabel } from "@/components/layout/MicroLabel";

const COPY = {
  login: {
    eyebrow: "Bon retour",
    title: "Connexion",
    text: "Connectez-vous pour réserver un cadeau ou retrouver vos réservations.",
  },
  register: {
    eyebrow: "Un compte pour réserver",
    title: "Inscription",
    text: "Créez un compte en une minute. Le propriétaire ne verra jamais vos réservations.",
  },
};

/**
 * Two columns on desktop (title left, white card right), one column on phones.
 * `useSearchParams` in the form needs the Suspense boundary.
 */
export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const copy = COPY[mode];
  return (
    <section className="container grid flex-1 gap-8 pt-10 md:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-start lg:gap-12 lg:pt-20">
      <div className="flex min-w-0 flex-col gap-5 md:gap-7">
        <MicroLabel>{copy.eyebrow}</MicroLabel>
        <DisplayTitle
          size="hero"
          className="text-[clamp(2.5rem,0.25rem+6vw,6.5rem)] tracking-[-0.05em]"
        >
          {copy.title}
        </DisplayTitle>
        <p className="text-[16px] max-w-[34ch] leading-[1.55] text-soft md:text-lead">
          {copy.text}
        </p>
      </div>
      <div className="auth-card">
        <Suspense fallback={<div className="skeleton h-80 w-full" aria-hidden="true" />}>
          <AuthForm mode={mode} />
        </Suspense>
      </div>
    </section>
  );
}
