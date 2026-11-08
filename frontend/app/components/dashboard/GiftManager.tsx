"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { GiftFormDrawer } from "@/components/dashboard/GiftFormDrawer";
import { GiftRow } from "@/components/dashboard/GiftRow";
import type { OwnerStore } from "@/hooks/use-owner-data";
import { deleteGift, reorderGifts, updateGift } from "@/lib/api-owner";
import { sortByPosition, swapIds } from "@/lib/reorder";
import type { Category, OwnerGift } from "@/lib/types";
import { groupGiftsByCategory } from "@/lib/wishlist-groups";

type GiftManagerProps = { store: OwnerStore; categories: Category[]; gifts: OwnerGift[] };

type DrawerState = { open: false } | { open: true; gift: OwnerGift | null };

export function GiftManager({ store, categories, gifts }: GiftManagerProps) {
  const [drawer, setDrawer] = useState<DrawerState>({ open: false });
  const [toDelete, setToDelete] = useState<OwnerGift | null>(null);
  const ordered = useMemo(() => sortByPosition(gifts), [gifts]);
  const groups = useMemo(() => groupGiftsByCategory(categories, ordered), [categories, ordered]);

  function move(groupGifts: OwnerGift[], index: number, direction: -1 | 1) {
    const neighbour = groupGifts[index + direction];
    if (!neighbour) return;
    const ids = swapIds(ordered, groupGifts[index].id, neighbour.id);
    void store.run((token) => reorderGifts(token, ids), "Le réordonnancement a échoué.");
  }

  function toggleVisibility(gift: OwnerGift) {
    void store.run(
      (token) => updateGift(token, gift.id, { is_visible: !gift.is_visible }),
      "Le changement de visibilité a échoué.",
    );
  }

  async function confirmDelete() {
    if (!toDelete) return;
    const ok = await store.run(
      (token) => deleteGift(token, toDelete.id),
      "La suppression a échoué.",
    );
    if (ok) setToDelete(null);
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-ink-soft">
          {gifts.length} {gifts.length > 1 ? "cadeaux" : "cadeau"} ·{" "}
          {gifts.filter((gift) => !gift.is_visible).length} masqué(s)
        </p>
        <Button variant="primary" onClick={() => setDrawer({ open: true, gift: null })}>
          <Plus className="size-4" aria-hidden="true" />
          Ajouter un cadeau
        </Button>
      </div>

      {gifts.length === 0 ? (
        <EmptyState
          title="Aucun cadeau"
          text="Ajoutez votre premier cadeau, à la main ou en collant l'adresse d'un produit."
        />
      ) : (
        groups
          .filter((group) => group.gifts.length > 0)
          .map((group) => (
            <section
              key={group.key}
              aria-labelledby={`gifts-${group.key}`}
              className="flex flex-col gap-4"
            >
              <h3 id={`gifts-${group.key}`} className="display text-2xl leading-tight">
                {group.name}.
              </h3>
              <ol className="flex flex-col divide-y divide-line border-y border-line bg-white">
                {group.gifts.map((gift, index) => (
                  <GiftRow
                    key={gift.id}
                    gift={gift}
                    categoryName={group.name}
                    isFirst={index === 0}
                    isLast={index === group.gifts.length - 1}
                    busy={store.busy}
                    onEdit={() => setDrawer({ open: true, gift })}
                    onToggleVisibility={() => toggleVisibility(gift)}
                    onMoveUp={() => move(group.gifts, index, -1)}
                    onMoveDown={() => move(group.gifts, index, 1)}
                    onDelete={() => setToDelete(gift)}
                  />
                ))}
              </ol>
            </section>
          ))
      )}

      <GiftFormDrawer
        open={drawer.open}
        gift={drawer.open ? drawer.gift : null}
        categories={categories}
        store={store}
        onClose={() => setDrawer({ open: false })}
      />
      <ConfirmDialog
        open={toDelete !== null}
        title={toDelete ? `Supprimer « ${toDelete.name} » ?` : ""}
        description="Le cadeau disparaîtra de la liste publique et les réservations associées seront perdues."
        busy={store.busy}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
