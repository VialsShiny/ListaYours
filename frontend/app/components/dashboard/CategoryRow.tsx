"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Check, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category } from "@/lib/types";

type CategoryRowProps = {
  category: Category;
  index: number;
  total: number;
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
    <li className="flex flex-wrap items-center gap-3 px-4 py-3 md:flex-nowrap">
      <span className="index-tag w-10 shrink-0">{String(index + 1).padStart(2, "0")}</span>
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
        <p className="text-body min-w-0 flex-1 truncate font-semibold">{category.name}</p>
      )}
      <div className="flex shrink-0 items-center gap-1">
        {!editing ? (
          <Button
            variant="icon"
            aria-label={`Renommer ${category.name}`}
            onClick={() => setEditing(true)}
          >
            <Pencil aria-hidden="true" />
          </Button>
        ) : null}
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
        <Button
          variant="icon"
          aria-label={`Supprimer ${category.name}`}
          disabled={busy}
          onClick={onDelete}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}
