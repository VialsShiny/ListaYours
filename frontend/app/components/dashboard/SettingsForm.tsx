"use client";

import { useEffect, useState } from "react";
import { voice } from "@/content/voice";
import { Button } from "@/components/ui/button";
import { SwapLabel } from "@/components/ui/swap-label";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { useClipboard } from "@/hooks/use-clipboard";
import type { OwnerStore } from "@/hooks/use-owner-data";
import { notifyError, notifySuccess } from "@/lib/toast";
import { patchWishlist } from "@/lib/api-owner";
import type { OwnerWishlist } from "@/lib/types";

type SettingsFormProps = { store: OwnerStore; wishlist: OwnerWishlist };

export function SettingsForm({ store, wishlist }: SettingsFormProps) {
  const [title, setTitle] = useState(wishlist.title);
  const [description, setDescription] = useState(wishlist.description ?? "");
  const [slug, setSlug] = useState(wishlist.slug);
  const [published, setPublished] = useState(wishlist.is_published);
  const [origin, setOrigin] = useState("");
  const [syncedAt, setSyncedAt] = useState(wishlist.updated_at);
  const clipboard = useClipboard();

  if (wishlist.updated_at !== syncedAt) {
    setSyncedAt(wishlist.updated_at);
    setTitle(wishlist.title);
    setDescription(wishlist.description ?? "");
    setSlug(wishlist.slug);
    setPublished(wishlist.is_published);
  }

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const publicPath = `/l/${slug || wishlist.slug}`;
  const publicUrl = `${origin}${publicPath}`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { ok } = await store.run(
      (token) =>
        patchWishlist(token, {
          title: title.trim(),
          description: description.trim() === "" ? null : description.trim(),
          slug: slug.trim(),
          is_published: published,
        }),
      voice.dashboard.settings.saveFailed,
    );
    if (ok) notifySuccess(voice.dashboard.settings.saved);
  }

  const copyLabel =
    clipboard.status === "copied" ? voice.dashboard.settings.copied : voice.dashboard.settings.copy;

  useEffect(() => {
    if (clipboard.status === "error") notifyError(voice.dashboard.settings.copyFailed);
  }, [clipboard.status]);

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:gap-6"
    >
      <div className="panel flex min-w-0 flex-col gap-5 p-5 md:p-8">
        <Field id="wishlist-title" label={voice.dashboard.settings.title} required>
          {(describedBy) => (
            <Input
              id="wishlist-title"
              required
              maxLength={120}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-describedby={describedBy}
            />
          )}
        </Field>
        <Field id="wishlist-description" label={voice.dashboard.settings.description}>
          {(describedBy) => (
            <Textarea
              id="wishlist-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              aria-describedby={describedBy}
            />
          )}
        </Field>
        <Field id="wishlist-slug" label={voice.dashboard.settings.slug} hint={publicUrl} required>
          {(describedBy) => (
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="field flex min-w-0 flex-1 items-center gap-1 focus-within:border-ink">
                <span className="text-soft" aria-hidden="true">
                  /l/
                </span>
                <input
                  id="wishlist-slug"
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  title={voice.dashboard.settings.slugHint}
                  value={slug}
                  onChange={(event) => setSlug(event.target.value.toLowerCase())}
                  aria-describedby={describedBy}
                  className="min-h-full min-w-0 flex-1 self-stretch border-0 bg-transparent p-0 outline-none"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                className="btn-state shrink-0"
                onClick={() => void clipboard.copy(publicUrl)}
              >
                <SwapLabel label={copyLabel} />
              </Button>
            </div>
          )}
        </Field>
      </div>
      <div className="panel flex min-w-0 flex-col justify-between gap-5 p-5 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-[16px] font-semibold">{voice.dashboard.settings.publicLabel}</p>
            <p className="text-[14px] leading-[1.5] text-soft">
              {published ? voice.dashboard.settings.publicOn : voice.dashboard.settings.publicOff}
            </p>
          </div>
          <Toggle
            id="wishlist-published"
            label={voice.dashboard.settings.publicLabel}
            labelHidden
            checked={published}
            onChange={setPublished}
          />
        </div>
        <div className="flex flex-col gap-3">
          <Button type="submit" variant="primary" block disabled={store.busy}>
            {store.busy ? voice.errors.wait : voice.dashboard.settings.save}
          </Button>
        </div>
      </div>
    </form>
  );
}
