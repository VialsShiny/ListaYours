"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoldButton } from "@/components/ui/hold-button";
import { Input } from "@/components/ui/input";
import { SortableRow } from "@/components/dashboard/SortableRow";
import type { Category } from "@/lib/types";
import { formatIndex } from "@/lib/wishlist-navigation";

type CategoryRowProps = {
  category: Category;
  index: number;
  count: number;
  busy: boolean;
  onRename: (name: string) => Promise<boolean>;
  onDelete: () => void;
  onConfirmDelete: () => void;
};

export function CategoryRow({
  category,
  index,
  count,
  busy,
  onRename,
  onDelete,
  onConfirmDelete,
}: CategoryRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(category.name);
  const inputId = `category-${category.id}-name`;

  async function submitRename(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || trimmed === category.name) {
      setEditing(false);
      return;
    }
    const ok = await onRename(trimmed);
    if (ok) setEditing(false);
  }

  return (
    <SortableRow
      id={category.id}
      handleLabel={`Réordonner ${category.name}`}
      className="list-row flex-wrap md:flex-nowrap"
    >
      <span className="index-tag w-9 shrink-0 text-[14px]">{formatIndex(index)}</span>
      {editing ? (
        <form onSubmit={submitRename} className="flex min-w-0 flex-1 items-center gap-2">
          <label htmlFor={inputId} className="sr-only">
            Nouveau nom de la catégorie
          </label>
          <Input
            id={inputId}
            autoFocus
            value={draft}
            maxLength={80}
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-11"
          />
          <Button type="submit" variant="icon" aria-label="Valider le nom" disabled={busy}>
            <Check aria-hidden="true" />
          </Button>
          <Button
            variant="icon"
            aria-label="Annuler le renommage"
            onClick={() => {
              setDraft(category.name);
              setEditing(false);
            }}
          >
            <X aria-hidden="true" />
          </Button>
        </form>
      ) : (
        <p className="display-card min-w-0 flex-1 truncate text-[17px] md:text-lead">
          {category.name}
        </p>
      )}
      <span className="text-small shrink-0 text-soft md:text-[14px]">
        {count} {count > 1 ? "cadeaux" : "cadeau"}
      </span>
      <div className="flex w-full shrink-0 items-center gap-1 md:w-auto">
        {!editing ? (
          <Button variant="text" onClick={() => setEditing(true)}>
            Renommer
          </Button>
        ) : null}
        <HoldButton
          label="Supprimer"
          holdLabel={`Maintenir 1 seconde pour supprimer ${category.name} ; ses cadeaux iront dans Autres`}
          disabled={busy}
          onConfirm={onDelete}
          onFallback={onConfirmDelete}
        />
      </div>
    </SortableRow>
  );
}
