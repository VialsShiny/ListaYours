"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type SortableRowProps = {
  id: number | string;
  handleLabel: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * One sortable `<li>` with a visible grab handle (pointer or keyboard). The row settles with the
 * spring curve; while dragged it lifts with a shadow and no transition.
 */
export function SortableRow({ id, handleLabel, className, children }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } =
    useSortable({ id, transition: null });
  const style = { transform: CSS.Translate.toString(transform) };

  return (
    <li
      ref={setNodeRef}
      style={style}
      data-dragging={isDragging ? "true" : undefined}
      className={cn("sortable-row", className)}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="sortable-handle"
        aria-label={handleLabel}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5" aria-hidden="true" />
      </button>
      {children}
    </li>
  );
}
