"use client";

import dynamic from "next/dynamic";
import { EmptyState } from "@/components/feedback/EmptyState";
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

  function countFor(category: Category) {
    return gifts.filter((gift) => String(gift.category_id) === String(category.id)).length;
  }

  function reorder(ids: Array<Category["id"]>) {
    void store.run((token) => reorderCategories(token, ids), "Le réordonnancement a échoué.");
  }

  function remove(category: Category) {
    void store.run(
      (token) => deleteCategory(token, category.id),
      "La suppression de la catégorie a échoué.",
    );
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
          labelOf={(id) => ordered.find((category) => category.id === id)?.name ?? ""}
          onReorder={reorder}
          className="panel flex flex-col overflow-hidden"
        >
          {ordered.map((category, index) => (
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
              onDelete={() => remove(category)}
            />
          ))}
        </SortableList>
      )}
    </div>
  );
}
