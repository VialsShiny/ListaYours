"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { errorMessage } from "@/lib/api";
import { login, register } from "@/lib/api-auth";
import { safeNextPath } from "@/lib/safe-next";

type AuthFormProps = { mode: "login" | "register" };

const COPY = {
  login: {
    submit: "Se connecter",
    busy: "Connexion…",
    other: { text: "Pas encore de compte ?", label: "Créer un compte →", href: "/inscription" },
  },
  register: {
    submit: "Créer mon compte",
    busy: "Création…",
    other: { text: "Déjà inscrit ?", label: "Se connecter →", href: "/connexion" },
  },
};

/**
 * Picks the field under which an API error is shown: e-mail errors under the e-mail field,
 * everything else under the password.
 */
function errorField(message: string): "email" | "password" {
  return /e-?mail|adresse/i.test(message) ? "email" : "password";
}

export function AuthForm({ mode }: AuthFormProps) {
  const copy = COPY[mode];
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const next = safeNextPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorSeq, setErrorSeq] = useState(0);
  const [busy, setBusy] = useState(false);
  const otherHref =
    next === "/" ? copy.other.href : `${copy.other.href}?next=${encodeURIComponent(next)}`;
  const errorOn = error ? errorField(error) : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const response =
        mode === "login"
          ? await login(email.trim(), password)
          : await register(email.trim(), password, displayName.trim());
      signIn(response.access_token, response.user);
      router.replace(next);
    } catch (caught) {
      setError(errorMessage(caught, "La connexion a échoué."));
      setErrorSeq((current) => current + 1);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {mode === "register" ? (
          <Field id="display_name" label="Prénom ou pseudo" required>
            {(describedBy) => (
              <Input
                id="display_name"
                name="display_name"
                autoComplete="nickname"
                required
                maxLength={80}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                aria-describedby={describedBy}
              />
            )}
          </Field>
        ) : null}
        <Field
          id="email"
          key={errorOn === "email" ? `email-${errorSeq}` : "email"}
          className={errorOn === "email" ? "shake" : undefined}
          label="Adresse e-mail"
          required
          error={errorOn === "email" ? error : null}
        >
          {(describedBy, invalid) => (
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
            />
          )}
        </Field>
        <Field
          id="password"
          key={errorOn === "password" ? `password-${errorSeq}` : "password"}
          className={errorOn === "password" ? "shake" : undefined}
          label="Mot de passe"
          hint={mode === "register" ? "Utilisez au moins 8 caractères." : undefined}
          error={errorOn === "password" ? error : null}
          required
        >
          {(describedBy, invalid) => (
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
            />
          )}
        </Field>
        <Button type="submit" variant="primary" size="hero" block disabled={busy} className="mt-1">
          {busy ? copy.busy : copy.submit}
        </Button>
      </form>
      <p className="text-secondary flex min-h-11 flex-wrap items-center justify-center gap-x-1.5 text-center text-soft">
        {copy.other.text}
        <Link href={otherHref} className="text-link">
          {copy.other.label}
        </Link>
      </p>
      {next !== "/" ? (
        <p className="text-small border-t border-line pt-4 leading-[1.5] text-soft">
          Après la connexion, vous reviendrez sur la page d&apos;où vous venez.
        </p>
      ) : null}
    </div>
  );
}
