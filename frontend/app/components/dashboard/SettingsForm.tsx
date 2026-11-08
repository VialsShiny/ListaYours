"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { StatusMessage } from "@/components/feedback/StatusMessage";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { useClipboard } from "@/hooks/use-clipboard";
import type { OwnerStore } from "@/hooks/use-owner-data";
import { patchWishlist } from "@/lib/api-owner";
import type { OwnerWishlist } from "@/lib/types";
import { cn } from "@/lib/utils";

type SettingsFormProps = { store: OwnerStore; wishlist: OwnerWishlist };

export function SettingsForm({ store, wishlist }: SettingsFormProps) {
  const [title, setTitle] = useState(wishlist.title);
  const [description, setDescription] = useState(wishlist.description ?? "");
  const [slug, setSlug] = useState(wishlist.slug);
  const [published, setPublished] = useState(wishlist.is_published);
  const [origin, setOrigin] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
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
    setSaved(null);
    const { ok } = await store.run(
      (token) =>
        patchWishlist(token, {
          title: title.trim(),
          description: description.trim() === "" ? null : description.trim(),
          slug: slug.trim(),
          is_published: published,
        }),
      "L'enregistrement des réglages a échoué.",
    );
    if (ok) setSaved("Réglages enregistrés.");
  }

  const clipboardMessage =
    clipboard.status === "copied"
      ? "Lien copié"
      : clipboard.status === "error"
        ? "Copie impossible"
        : null;

  return (
    <Card tone="white" className="max-w-3xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Field id="wishlist-title" label="Titre" required>
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
        <Field id="wishlist-description" label="Description">
          {(describedBy) => (
            <Textarea
              id="wishlist-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              aria-describedby={describedBy}
            />
          )}
        </Field>
        <Field id="wishlist-slug" label="Slug" hint={`Adresse publique : ${publicUrl}`} required>
          {(describedBy) => (
            <Input
              id="wishlist-slug"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              title="Lettres minuscules, chiffres et tirets"
              value={slug}
              onChange={(event) => setSlug(event.target.value.toLowerCase())}
              aria-describedby={describedBy}
            />
          )}
        </Field>
        <Toggle
          id="wishlist-published"
          label="Publiée"
          hint={published ? "La liste est visible à son adresse publique." : "La liste est privée."}
          checked={published}
          onChange={setPublished}
        />
        <div className="hairline flex flex-wrap items-center gap-3 pt-5">
          <Button type="submit" variant="primary" disabled={store.busy}>
            {store.busy ? "Enregistrement…" : "Enregistrer"}
          </Button>
          <Button type="button" variant="outline" onClick={() => clipboard.copy(publicUrl)}>
            Copier le lien
          </Button>
          <a
            href={publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            Aperçu public
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </div>
        <StatusMessage message={clipboardMessage ?? saved} />
      </form>
    </Card>
  );
}
