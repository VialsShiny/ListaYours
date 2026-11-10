"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@/lib/dnd-modifiers";

type Id = number | string;

type SortableListProps = {
  ids: Id[];
  labelOf: (id: Id) => string;
  onReorder: (ids: Id[]) => void;
  renderRow: (id: Id, index: number) => React.ReactNode;
  className?: string;
};

const INSTRUCTIONS =
  "Pour réordonner, appuyez sur Espace sur la poignée, déplacez avec les flèches, puis Espace pour déposer ou Échap pour annuler.";

/**
 * Vertical drag-and-drop sorting with a pointer or the keyboard (dnd-kit). The order is kept
 * locally so a dropped row stays in place while the API call runs, then resyncs from `ids`.
 */
export function SortableList({ ids, labelOf, onReorder, renderRow, className }: SortableListProps) {
  const [order, setOrder] = useState(ids);
  const key = ids.join("|");

  useEffect(() => {
    setOrder(key === "" ? [] : ids);
  }, [key, ids]);

  const position = (id: Id) => order.indexOf(id) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `${labelOf(active.id)} saisi, position ${position(active.id)} sur ${order.length}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${labelOf(active.id)} déplacé en position ${position(over.id)} sur ${order.length}.`
        : `${labelOf(active.id)} hors de la liste.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `${labelOf(active.id)} déposé en position ${position(over.id)} sur ${order.length}.`
        : `${labelOf(active.id)} relâché.`,
    onDragCancel: ({ active }) => `Déplacement de ${labelOf(active.id)} annulé.`,
  };
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = order.indexOf(active.id);
    const to = order.indexOf(over.id);
    if (from < 0 || to < 0) return;
    const next = arrayMove(order, from, to);
    setOrder(next);
    onReorder(next);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
      accessibility={{ screenReaderInstructions: { draggable: INSTRUCTIONS }, announcements }}
    >
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <ol className={className}>{order.map((id, index) => renderRow(id, index))}</ol>
      </SortableContext>
    </DndContext>
  );
}
