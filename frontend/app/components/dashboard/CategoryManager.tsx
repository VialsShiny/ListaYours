"use client";

import { useState } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CategoryAddForm } from "@/components/dashboard/CategoryAddForm";
import { CategoryRow } from "@/components/dashboard/CategoryRow";
import type { OwnerStore } from "@/hooks/use-owner-data";
import { deleteCategory, renameCategory, reorderCategories } from "@/lib/api-owner";
import type { Category } from "@/lib/types";
import { moveId } from "@/lib/wishlist-groups";
import { sortByPosition } from "@/lib/reorder";

type CategoryManagerProps = { store: OwnerStore; categories: Category[] };

export function CategoryManager({ store, categories }: CategoryManagerProps) {
  const ordered = sortByPosition(categories);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  function move(index: number, direction: -1 | 1) {
    const ids = moveId(ordered, index, direction);
    if (!ids) return;
    void store.run((token) => reorderCategories(token, ids), "Le réordonnancement a échoué.");
  }

  async function confirmDelete() {
    if (!toDelete) return;
    const ok = await store.run(
      (token) => deleteCategory(token, toDelete.id),
      "La suppression de la catégorie a échoué.",
    );
    if (ok) setToDelete(null);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(16rem,20rem)]">
      {ordered.length === 0 ? (
        <EmptyState
          title="Aucune catégorie"
          text="Créez une première catégorie pour ranger vos cadeaux."
        />
      ) : (
        <ol className="flex flex-col divide-y divide-line border-y border-line bg-white">
          {ordered.map((category, index) => (
            <CategoryRow
              key={category.id}
              category={category}
              index={index}
              total={ordered.length}
              busy={store.busy}
              onRename={(name) =>
                store.run(
                  (token) => renameCategory(token, category.id, name),
                  "Le renommage a échoué.",
                )
              }
              onMoveUp={() => move(index, -1)}
              onMoveDown={() => move(index, 1)}
              onDelete={() => setToDelete(category)}
            />
          ))}
        </ol>
      )}
      <CategoryAddForm store={store} />
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
