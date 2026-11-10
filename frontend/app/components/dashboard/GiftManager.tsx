"use client";

import { useMemo, useState } from "react";
import { voice } from "@/content/voice";
import dynamic from "next/dynamic";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  const [toConfirm, setToConfirm] = useState<OwnerGift | null>(null);
  const [expanded, setExpanded] = useState(false);
  const ordered = useMemo(() => sortByPosition(gifts), [gifts]);
  const byId = useMemo(() => new Map(ordered.map((gift) => [gift.id, gift])), [ordered]);
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
      voice.dashboard.gifts.reorderFailed,
    );
  }

  function toggleVisibility(gift: OwnerGift) {
    void store.run(
      (token) => updateGift(token, gift.id, { is_visible: !gift.is_visible }),
      voice.dashboard.gifts.visibilityFailed,
    );
  }

  async function remove(gift: OwnerGift) {
    const { ok } = await store.run(
      (token) => deleteGift(token, gift.id),
      voice.dashboard.gifts.deleteFailed,
    );
    if (ok) setToConfirm(null);
  }

  const openForm = (gift: OwnerGift | null) => setDrawer({ open: true, gift });

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <DashboardSectionTitle
        id="cadeaux-titre"
        index="#03"
        title={voice.dashboard.sections.gifts}
        aside={
          <div className="flex items-center gap-4">
            <p className="text-secondary text-soft">
              {voice.dashboard.categories.count(gifts.length)}
            </p>
            <Button variant="primary" className="max-md:hidden" onClick={() => openForm(null)}>
              {voice.dashboard.gifts.add}
            </Button>
          </div>
        }
      />
      {ordered.length === 0 ? (
        <EmptyState
          title={voice.dashboard.gifts.emptyTitle}
          text={voice.dashboard.gifts.emptyText}
          action={
            <Button variant="primary" size="sm" onClick={() => openForm(null)}>
              {voice.dashboard.gifts.add}
            </Button>
          }
        />
      ) : (
        <div className="panel flex flex-col overflow-hidden">
          <SortableList
            ids={visible.map((gift) => gift.id)}
            labelOf={(id) => byId.get(id)?.name ?? ""}
            onReorder={reorder}
            renderRow={(id) => {
              const gift = byId.get(id);
              if (!gift) return null;
              return (
                <GiftRow
                  key={gift.id}
                  gift={gift}
                  categoryName={names.get(String(gift.category_id)) ?? "Autres"}
                  busy={store.busy}
                  onEdit={() => openForm(gift)}
                  onToggleVisibility={() => toggleVisibility(gift)}
                  onDelete={() => void remove(gift)}
                  onConfirmDelete={() => setToConfirm(gift)}
                />
              );
            }}
          />
          {hidden > 0 ? (
            <div className="flex justify-center border-t border-line">
              <Button variant="text-accent" className="min-h-16" onClick={() => setExpanded(true)}>
                {voice.dashboard.gifts.showMore(hidden)}
              </Button>
            </div>
          ) : null}
        </div>
      )}
      <div className="sticky-bar -mx-4 md:hidden">
        <Button variant="primary" block onClick={() => openForm(null)}>
          {voice.dashboard.gifts.add}
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
        open={toConfirm !== null}
        title={toConfirm ? voice.dashboard.gifts.dialogTitle(toConfirm.name) : ""}
        description={voice.dashboard.gifts.dialogText}
        busy={store.busy}
        onConfirm={() => toConfirm && void remove(toConfirm)}
        onCancel={() => setToConfirm(null)}
      />
    </div>
  );
}
