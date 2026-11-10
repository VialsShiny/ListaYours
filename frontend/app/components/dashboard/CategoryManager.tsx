"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CategoryAddForm } from "@/components/dashboard/CategoryAddForm";
import { CategoryRow } from "@/components/dashboard/CategoryRow";
import type { OwnerStore } from "@/hooks/use-owner-data";
import { deleteCategory, renameCategory, reorderCategories } from "@/lib/api-owner";
import type { Category, OwnerGift } from "@/lib/types";
import { sortByPosition } from "@/lib/reorder";

const SortableList = dynamic(
  () => import("@/components/dashboard/SortableList").then((module) => module.SortableList),
  { ssr: false },
);

type CategoryManagerProps = { store: OwnerStore; categories: Category[]; gifts: OwnerGift[] };

export function CategoryManager({ store, categories, gifts }: CategoryManagerProps) {
  const ordered = sortByPosition(categories);
  const [toConfirm, setToConfirm] = useState<Category | null>(null);
  const byId = new Map(ordered.map((category) => [category.id, category]));

  function countFor(category: Category) {
    return gifts.filter((gift) => String(gift.category_id) === String(category.id)).length;
  }

  function reorder(ids: Array<Category["id"]>) {
    void store.run((token) => reorderCategories(token, ids), "Le réordonnancement a échoué.");
  }

  async function remove(category: Category) {
    const { ok } = await store.run(
      (token) => deleteCategory(token, category.id),
      "La suppression de la catégorie a échoué.",
    );
    if (ok) setToConfirm(null);
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
        <SortableList
          ids={ordered.map((category) => category.id)}
          labelOf={(id) => byId.get(id)?.name ?? ""}
          onReorder={reorder}
          className="panel flex flex-col overflow-hidden"
          renderRow={(id, index) => {
            const category = byId.get(id);
            if (!category) return null;
            return (
              <CategoryRow
                key={category.id}
                category={category}
                index={index}
                count={countFor(category)}
                busy={store.busy}
                onRename={async (name) => {
                  const result = await store.run(
                    (token) => renameCategory(token, category.id, name),
                    "Le renommage a échoué.",
                  );
                  return result.ok;
                }}
                onDelete={() => void remove(category)}
                onConfirmDelete={() => setToConfirm(category)}
              />
            );
          }}
        />
      )}
      <ConfirmDialog
        open={toConfirm !== null}
        title={toConfirm ? `Supprimer « ${toConfirm.name} » ?` : ""}
        description="Les cadeaux de cette catégorie seront déplacés dans « Autres »."
        busy={store.busy}
        onConfirm={() => toConfirm && void remove(toConfirm)}
        onCancel={() => setToConfirm(null)}
      />
    </div>
  );
}
