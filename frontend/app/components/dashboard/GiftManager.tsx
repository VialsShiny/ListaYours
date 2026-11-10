"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/button";
import { DashboardSectionTitle } from "@/components/dashboard/DashboardSectionTitle";
import { GiftFormDrawer } from "@/components/dashboard/GiftFormDrawer";
import { GiftRow } from "@/components/dashboard/GiftRow";
import type { OwnerStore } from "@/hooks/use-owner-data";
import { deleteGift, reorderGifts, updateGift } from "@/lib/api-owner";
import { sortByPosition } from "@/lib/reorder";
import type { Category, OwnerGift } from "@/lib/types";

const SortableList = dynamic(
  () => import("@/components/dashboard/SortableList").then((module) => module.SortableList),
  { ssr: false },
);

const INITIAL_ROWS = 6;

type GiftManagerProps = { store: OwnerStore; categories: Category[]; gifts: OwnerGift[] };

type DrawerState = { open: false } | { open: true; gift: OwnerGift | null };

export function GiftManager({ store, categories, gifts }: GiftManagerProps) {
  const [drawer, setDrawer] = useState<DrawerState>({ open: false });
  const [expanded, setExpanded] = useState(false);
  const ordered = useMemo(() => sortByPosition(gifts), [gifts]);
  const names = useMemo(
    () => new Map(categories.map((category) => [String(category.id), category.name])),
    [categories],
  );
  const visible = expanded ? ordered : ordered.slice(0, INITIAL_ROWS);
  const hidden = ordered.length - visible.length;

  function reorder(visibleIds: Array<OwnerGift["id"]>) {
    const rest = ordered.slice(visible.length).map((gift) => gift.id);
    void store.run(
      (token) => reorderGifts(token, [...visibleIds, ...rest]),
      "Le réordonnancement a échoué.",
    );
  }

  function toggleVisibility(gift: OwnerGift) {
    void store.run(
      (token) => updateGift(token, gift.id, { is_visible: !gift.is_visible }),
      "Le changement de visibilité a échoué.",
    );
  }

  function remove(gift: OwnerGift) {
    void store.run((token) => deleteGift(token, gift.id), "La suppression a échoué.");
  }

  const openForm = (gift: OwnerGift | null) => setDrawer({ open: true, gift });

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <DashboardSectionTitle
        id="cadeaux-titre"
        index="#03"
        title="Cadeaux"
        aside={
          <div className="flex items-center gap-4">
            <p className="text-secondary text-soft">
              {gifts.length} {gifts.length > 1 ? "cadeaux" : "cadeau"}
            </p>
            <Button variant="primary" className="max-md:hidden" onClick={() => openForm(null)}>
              Ajouter un cadeau
            </Button>
          </div>
        }
      />
      {ordered.length === 0 ? (
        <EmptyState
          title="Aucun cadeau pour l'instant"
          text="Ajoutez votre premier cadeau en collant un lien produit."
          action={
            <Button variant="primary" size="sm" onClick={() => openForm(null)}>
              Ajouter un cadeau
            </Button>
          }
        />
      ) : (
        <div className="panel flex flex-col overflow-hidden">
          <SortableList
            ids={visible.map((gift) => gift.id)}
            labelOf={(id) => visible.find((gift) => gift.id === id)?.name ?? ""}
            onReorder={reorder}
          >
            {visible.map((gift) => (
              <GiftRow
                key={gift.id}
                gift={gift}
                categoryName={names.get(String(gift.category_id)) ?? "Autres"}
                busy={store.busy}
                onEdit={() => openForm(gift)}
                onToggleVisibility={() => toggleVisibility(gift)}
                onDelete={() => remove(gift)}
              />
            ))}
          </SortableList>
          {hidden > 0 ? (
            <div className="flex justify-center border-t border-line">
              <Button variant="text-accent" className="min-h-16" onClick={() => setExpanded(true)}>
                Afficher les {hidden} autres cadeaux →
              </Button>
            </div>
          ) : null}
        </div>
      )}
      <div className="sticky-bar -mx-4 md:hidden">
        <Button variant="primary" block onClick={() => openForm(null)}>
          Ajouter un cadeau
        </Button>
      </div>
      <GiftFormDrawer
        open={drawer.open}
        gift={drawer.open ? drawer.gift : null}
        categories={categories}
        store={store}
        onClose={() => setDrawer({ open: false })}
      />
    </div>
  );
}
