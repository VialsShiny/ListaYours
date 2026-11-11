"use client";

import { useState } from "react";
import { voice } from "@/content/voice";
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
      handleLabel={voice.dashboard.categories.reorder(category.name)}
      className="list-row flex-wrap md:flex-nowrap"
    >
      <span className="index-tag w-9 shrink-0 text-[14px]">{formatIndex(index)}</span>
      {editing ? (
        <form onSubmit={submitRename} className="flex min-w-0 flex-1 items-center gap-2">
          <label htmlFor={inputId} className="sr-only">
            {voice.dashboard.categories.renameLabel}
          </label>
          <Input
            id={inputId}
            autoFocus
            value={draft}
            maxLength={80}
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-11"
          />
          <Button
            type="submit"
            variant="icon"
            aria-label={voice.dashboard.categories.validate}
            disabled={busy}
          >
            <Check aria-hidden="true" />
          </Button>
          <Button
            variant="icon"
            aria-label={voice.dashboard.categories.cancelRename}
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
        {voice.dashboard.categories.count(count)}
      </span>
      <div className="flex w-full shrink-0 items-center gap-1 md:w-auto">
        {!editing ? (
          <Button variant="text" onClick={() => setEditing(true)}>
            {voice.dashboard.categories.rename}
          </Button>
        ) : null}
        <HoldButton
          label={voice.dashboard.categories.remove}
          holdLabel={voice.dashboard.categories.hold(category.name)}
          disabled={busy}
          onConfirm={onDelete}
          onFallback={onConfirmDelete}
        />
      </div>
    </SortableRow>
  );
}
