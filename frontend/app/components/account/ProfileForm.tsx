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

type ProfileFormProps = { user: User; token: string };

/**
 * Pseudo and e-mail. The role is shown read-only; values are kept on error.
 */
export function ProfileForm({ user, token }: ProfileFormProps) {
  const { updateUser } = useAuth();
  const [name, setName] = useState(user.display_name);
  const [email, setEmail] = useState(user.email);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const emailError = error && /e-?mail|adresse/i.test(error) ? error : null;
  const otherError = error && !emailError ? error : null;
  const dirty = name.trim() !== user.display_name || email.trim().toLowerCase() !== user.email;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const next = await updateProfile(token, { display_name: name.trim(), email: email.trim() });
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
      <StatusMessage message={otherError} tone="error" />
      <Button type="submit" variant="primary" disabled={saving || !dirty} className="self-start">
        {saving ? voice.errors.wait : voice.account.profile.save}
      </Button>
    </form>
  );
}
