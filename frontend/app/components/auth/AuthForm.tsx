"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { StatusMessage } from "@/components/feedback/StatusMessage";
import { DisplayTitle } from "@/components/layout/DisplayTitle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { errorMessage } from "@/lib/api";
import { login, register } from "@/lib/api-auth";
import { safeNextPath } from "@/lib/safe-next";

type AuthFormProps = { mode: "login" | "register" };

const COPY = {
  login: {
    title: "Connexion",
    submit: "Se connecter",
    busy: "Connexion…",
    other: { text: "Pas encore de compte ?", label: "Créer un compte", href: "/inscription" },
  },
  register: {
    title: "Inscription",
    submit: "Créer mon compte",
    busy: "Création…",
    other: { text: "Déjà inscrit ?", label: "Se connecter", href: "/connexion" },
  },
};

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
  const [busy, setBusy] = useState(false);
  const otherHref =
    next === "/" ? copy.other.href : `${copy.other.href}?next=${encodeURIComponent(next)}`;

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
      setBusy(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <p className="eyebrow mb-3">Compte</p>
      <DisplayTitle size="section" className="mb-8">
        {copy.title}
      </DisplayTitle>
      <form onSubmit={handleSubmit} noValidate={false} className="flex flex-col gap-5">
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
        <Field id="email" label="E-mail" required>
          {(describedBy) => (
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-describedby={describedBy}
            />
          )}
        </Field>
        <Field id="password" label="Mot de passe" hint="8 à 72 caractères." required>
          {(describedBy) => (
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
            />
          )}
        </Field>
        <StatusMessage message={error} tone="error" />
        <Button type="submit" variant="primary" block disabled={busy} className="mt-2">
          {busy ? copy.busy : copy.submit}
        </Button>
      </form>
      <p className="text-subhead mt-8 flex flex-wrap items-baseline gap-x-2 border-t border-line pt-5 text-ink-soft">
        {copy.other.text}
        <Link href={otherHref} className="text-link">
          {copy.other.label}
        </Link>
      </p>
    </Card>
  );
}
