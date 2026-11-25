"use client";

import { useState } from "react";
import { voice } from "@/content/voice";
import { StatusMessage } from "@/components/feedback/StatusMessage";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { errorMessage } from "@/lib/api";
import { updateProfile } from "@/lib/api-account";
import { notifySuccess } from "@/lib/toast";
import type { User } from "@/lib/types";

type ProfileFormProps = { user: User };

/**
 * Pseudo and e-mail. The role is shown read-only; values are kept on error. Changing the
 * e-mail asks for the current password, which the API requires; its messages are shown as-is.
 */
export function ProfileForm({ user }: ProfileFormProps) {
  const { updateUser } = useAuth();
  const [name, setName] = useState(user.display_name);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const emailChanged = email.trim().toLowerCase() !== user.email;
  const passwordError = error && emailChanged && /mot de passe/i.test(error) ? error : null;
  const emailError = error && !passwordError && /e-?mail|adresse/i.test(error) ? error : null;
  const otherError = error && !emailError && !passwordError ? error : null;
  const dirty = name.trim() !== user.display_name || emailChanged;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const next = await updateProfile(
        emailChanged
          ? { display_name: name.trim(), email: email.trim(), current_password: password }
          : { display_name: name.trim() },
      );
      setPassword("");
      updateUser(next);
      notifySuccess(voice.account.profile.saved);
    } catch (caught) {
      setError(errorMessage(caught, voice.account.profile.failed));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel flex max-w-[640px] flex-col gap-5 p-5 md:p-8">
      <Field id="account-name" label={voice.account.profile.name} required>
        {(describedBy) => (
          <Input
            id="account-name"
            name="display_name"
            autoComplete="nickname"
            required
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-describedby={describedBy}
          />
        )}
      </Field>
      <Field id="account-email" label={voice.account.profile.email} required error={emailError}>
        {(describedBy, invalid) => (
          <Input
            id="account-email"
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
      {emailChanged ? (
        <Field
          id="account-current-password"
          label={voice.account.profile.currentPassword}
          hint={voice.account.profile.currentPasswordHint}
          required
          error={passwordError}
        >
          {(describedBy, invalid) => (
            <Input
              id="account-current-password"
              name="current_password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={72}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
            />
          )}
        </Field>
      ) : null}
      <StatusMessage message={otherError} tone="error" />
      <Button type="submit" variant="primary" disabled={saving || !dirty} className="self-start">
        {saving ? voice.errors.wait : voice.account.profile.save}
      </Button>
    </form>
  );
}
