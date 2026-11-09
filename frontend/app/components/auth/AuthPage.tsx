import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

/**
 * Centres the auth card on the page. `useSearchParams` needs the Suspense boundary.
 */
export function AuthPage({ mode }: { mode: "login" | "register" }) {
  return (
    <section className="section container flex flex-1 items-start justify-center md:items-center">
      <Suspense fallback={<div className="skeleton h-96 w-full max-w-md" aria-hidden="true" />}>
        <AuthForm mode={mode} />
      </Suspense>
    </section>
  );
}
