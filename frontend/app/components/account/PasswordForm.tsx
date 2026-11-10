"use client";

import { useState } from "react";
import { voice } from "@/content/voice";
import { StatusMessage } from "@/components/feedback/StatusMessage";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { errorMessage } from "@/lib/api";
import { changePassword } from "@/lib/api-account";
import { notifySuccess } from "@/lib/toast";

type PasswordFormProps = { token: string };

/**
 * Current password, new password; fields are cleared only after a confirmed change.
 */
export function PasswordForm({ token }: PasswordFormProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const currentError = error && /actuel/i.test(error) ? error : null;
  const nextError =
    error && !currentError && /mot de passe|caract|octets/i.test(error) ? error : null;
  const otherError = error && !currentError && !nextError ? error : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await changePassword(token, current, next);
      setCurrent("");
      setNext("");
      notifySuccess(voice.account.password.saved);
    } catch (caught) {
      setError(errorMessage(caught, voice.account.password.failed));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel flex max-w-[640px] flex-col gap-5 p-5 md:p-8">
      <Field
        id="current-password"
        label={voice.account.password.current}
        required
        error={currentError}
      >
        {(describedBy, invalid) => (
          <Input
            id="current-password"
            name="current_password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={72}
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
          />
        )}
      </Field>
      <Field
        id="new-password"
        label={voice.account.password.next}
        hint={voice.account.password.hint}
        required
        error={nextError}
      >
        {(describedBy, invalid) => (
          <Input
            id="new-password"
            name="new_password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            value={next}
            onChange={(event) => setNext(event.target.value)}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
          />
        )}
      </Field>
      <StatusMessage message={otherError} tone="error" />
      <Button
        type="submit"
        variant="primary"
        disabled={saving || current === "" || next.length < 8}
        className="self-start"
      >
        {saving ? voice.errors.wait : voice.account.password.save}
      </Button>
    </form>
  );
}
