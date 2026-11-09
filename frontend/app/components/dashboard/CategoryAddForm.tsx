"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { OwnerStore } from "@/hooks/use-owner-data";
import { createCategory } from "@/lib/api-owner";

export function CategoryAddForm({ store }: { store: OwnerStore }) {
  const [name, setName] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const { ok } = await store.run(
      (token) => createCategory(token, trimmed),
      "La création de la catégorie a échoué.",
    );
    if (ok) setName("");
  }

  return (
    <form onSubmit={handleSubmit} className="panel flex flex-col gap-4 self-start p-5">
      <p className="eyebrow">Nouvelle catégorie</p>
      <Field id="new-category" label="Nom" required>
        {(describedBy) => (
          <Input
            id="new-category"
            required
            maxLength={80}
            placeholder="Maison, Lecture, Voyage…"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-describedby={describedBy}
          />
        )}
      </Field>
      <Button type="submit" variant="primary" disabled={store.busy || name.trim() === ""}>
        Ajouter
      </Button>
    </form>
  );
}
