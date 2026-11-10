"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DashboardSectionTitle } from "@/components/dashboard/DashboardSectionTitle";
import { GiftFormDrawer } from "@/components/dashboard/GiftFormDrawer";
import { GiftRow } from "@/components/dashboard/GiftRow";
import type { OwnerStore } from "@/hooks/use-owner-data";
import { deleteGift, reorderGifts, updateGift } from "@/lib/api-owner";
import { sortByPosition, swapIds } from "@/lib/reorder";
import type { Category, OwnerGift } from "@/lib/types";

const INITIAL_ROWS = 6;

type GiftManagerProps = { store: OwnerStore; categories: Category[]; gifts: OwnerGift[] };

type DrawerState = { open: false } | { open: true; gift: OwnerGift | null };

export function GiftManager({ store, categories, gifts }: GiftManagerProps) {
  const [drawer, setDrawer] = useState<DrawerState>({ open: false });
  const [toDelete, setToDelete] = useState<OwnerGift | null>(null);
  const [expanded, setExpanded] = useState(false);
  const ordered = useMemo(() => sortByPosition(gifts), [gifts]);
  const names = useMemo(
    () => new Map(categories.map((category) => [String(category.id), category.name])),
    [categories],
  );
  const visible = expanded ? ordered : ordered.slice(0, INITIAL_ROWS);
  const hidden = ordered.length - visible.length;

  function move(index: number, direction: -1 | 1) {
    const neighbour = ordered[index + direction];
    if (!neighbour) return;
    const ids = swapIds(ordered, ordered[index].id, neighbour.id);
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
    const { ok } = await store.run(
      (token) => deleteGift(token, toDelete.id),
      "La suppression a échoué.",
    );
    if (ok) setToDelete(null);
  }

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
            <Button
              variant="primary"
              className="max-md:hidden"
              onClick={() => setDrawer({ open: true, gift: null })}
            >
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
            <Button
              variant="primary"
              size="sm"
              onClick={() => setDrawer({ open: true, gift: null })}
            >
              Ajouter un cadeau
            </Button>
          }
        />
      ) : (
        <ol className="panel flex flex-col overflow-hidden">
          {visible.map((gift, index) => (
            <GiftRow
              key={gift.id}
              gift={gift}
              categoryName={names.get(String(gift.category_id)) ?? "Autres"}
              isFirst={index === 0}
              isLast={index === ordered.length - 1}
              busy={store.busy}
              onEdit={() => setDrawer({ open: true, gift })}
              onToggleVisibility={() => toggleVisibility(gift)}
              onMoveUp={() => move(index, -1)}
              onMoveDown={() => move(index, 1)}
              onDelete={() => setToDelete(gift)}
            />
          ))}
          {hidden > 0 ? (
            <li className="flex justify-center border-t border-line">
              <Button variant="text-accent" className="min-h-16" onClick={() => setExpanded(true)}>
                Afficher les {hidden} autres cadeaux →
              </Button>
            </li>
          ) : null}
        </ol>
      )}
      <div className="sticky-bar -mx-4 md:hidden">
        <Button variant="primary" block onClick={() => setDrawer({ open: true, gift: null })}>
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
