import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

/**
 * Centres the auth card on a light-grey band. `useSearchParams` needs the Suspense boundary.
 */
export function AuthPage({ mode }: { mode: "login" | "register" }) {
  return (
    <section className="flex flex-1 items-start justify-center bg-surface-alt px-4 py-12 md:items-center md:px-12 md:py-20 lg:px-16">
      <Suspense fallback={<div className="skeleton h-96 w-full max-w-md" aria-hidden="true" />}>
        <AuthForm mode={mode} />
      </Suspense>
    </section>
  );
}
