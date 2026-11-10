"use client";

import { useState } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CategoryAddForm } from "@/components/dashboard/CategoryAddForm";
import { CategoryRow } from "@/components/dashboard/CategoryRow";
import type { OwnerStore } from "@/hooks/use-owner-data";
import { deleteCategory, renameCategory, reorderCategories } from "@/lib/api-owner";
import type { Category, OwnerGift } from "@/lib/types";
import { moveId } from "@/lib/wishlist-groups";
import { sortByPosition } from "@/lib/reorder";

type CategoryManagerProps = { store: OwnerStore; categories: Category[]; gifts: OwnerGift[] };

export function CategoryManager({ store, categories, gifts }: CategoryManagerProps) {
  const ordered = sortByPosition(categories);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  function countFor(category: Category) {
    return gifts.filter((gift) => String(gift.category_id) === String(category.id)).length;
  }

  function move(index: number, direction: -1 | 1) {
    const ids = moveId(ordered, index, direction);
    if (!ids) return;
    void store.run((token) => reorderCategories(token, ids), "Le réordonnancement a échoué.");
  }

  async function confirmDelete() {
    if (!toDelete) return;
    const { ok } = await store.run(
      (token) => deleteCategory(token, toDelete.id),
      "La suppression de la catégorie a échoué.",
    );
    if (ok) setToDelete(null);
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <CategoryAddForm store={store} />
      {ordered.length === 0 ? (
        <EmptyState
          title="Aucune catégorie"
          text="Créez une première catégorie pour ranger vos cadeaux."
        />
      ) : (
        <ol className="panel flex flex-col overflow-hidden">
          {ordered.map((category, index) => (
            <CategoryRow
              key={category.id}
              category={category}
              index={index}
              total={ordered.length}
              count={countFor(category)}
              busy={store.busy}
              onRename={async (name) => {
                const result = await store.run(
                  (token) => renameCategory(token, category.id, name),
                  "Le renommage a échoué.",
                );
                return result.ok;
              }}
              onMoveUp={() => move(index, -1)}
              onMoveDown={() => move(index, 1)}
              onDelete={() => setToDelete(category)}
            />
          ))}
        </ol>
      )}
      <ConfirmDialog
        open={toDelete !== null}
        title={toDelete ? `Supprimer « ${toDelete.name} » ?` : ""}
        description="Les cadeaux de cette catégorie seront déplacés dans « Autres »."
        busy={store.busy}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
