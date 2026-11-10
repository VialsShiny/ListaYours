"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
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
  children: React.ReactNode;
  className?: string;
};

const INSTRUCTIONS =
  "Pour réordonner, appuyez sur Espace sur la poignée, déplacez avec les flèches, puis Espace pour déposer ou Échap pour annuler.";

/**
 * Vertical drag-and-drop sorting with a pointer or the keyboard (dnd-kit). The children must be
 * `SortableRow`s whose ids match `ids`; `onReorder` receives the new id order after a drop.
 */
export function SortableList({ ids, labelOf, onReorder, children, className }: SortableListProps) {
  const position = (id: Id) => ids.indexOf(id) + 1;
  const announcements = {
    onDragStart: ({ active }: { active: { id: Id } }) =>
      `${labelOf(active.id)} saisi, position ${position(active.id)} sur ${ids.length}.`,
    onDragOver: ({ active, over }: { active: { id: Id }; over: { id: Id } | null }) =>
      over
        ? `${labelOf(active.id)} déplacé en position ${position(over.id)} sur ${ids.length}.`
        : `${labelOf(active.id)} hors de la liste.`,
    onDragEnd: ({ active, over }: { active: { id: Id }; over: { id: Id } | null }) =>
      over
        ? `${labelOf(active.id)} déposé en position ${position(over.id)} sur ${ids.length}.`
        : `${labelOf(active.id)} relâché.`,
    onDragCancel: ({ active }: { active: { id: Id } }) =>
      `Déplacement de ${labelOf(active.id)} annulé.`,
  };
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(active.id);
    const to = ids.indexOf(over.id);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(ids, from, to));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
      accessibility={{ screenReaderInstructions: { draggable: INSTRUCTIONS }, announcements }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ol className={className}>{children}</ol>
      </SortableContext>
    </DndContext>
  );
}
