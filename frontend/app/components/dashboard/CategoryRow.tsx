"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category } from "@/lib/types";
import { formatIndex } from "@/lib/wishlist-navigation";

type CategoryRowProps = {
  category: Category;
  index: number;
  total: number;
  count: number;
  busy: boolean;
  onRename: (name: string) => Promise<boolean>;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
};

export function CategoryRow({
  category,
  index,
  total,
  count,
  busy,
  onRename,
  onMoveUp,
  onMoveDown,
  onDelete,
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
    <li className="list-row flex-wrap md:flex-nowrap">
      <span className="drag-handle max-md:hidden" aria-hidden="true">
        ⋮⋮
      </span>
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
        <Button
          variant="icon"
          aria-label={`Monter ${category.name}`}
          disabled={busy || index === 0}
          onClick={onMoveUp}
        >
          <ArrowUp aria-hidden="true" />
        </Button>
        <Button
          variant="icon"
          aria-label={`Descendre ${category.name}`}
          disabled={busy || index === total - 1}
          onClick={onMoveDown}
        >
          <ArrowDown aria-hidden="true" />
        </Button>
        {!editing ? (
          <Button variant="text" onClick={() => setEditing(true)}>
            Renommer
          </Button>
        ) : null}
        <Button variant="text-accent" disabled={busy} onClick={onDelete}>
          Supprimer
        </Button>
      </div>
    </li>
  );
}
