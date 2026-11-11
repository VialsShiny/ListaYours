import type { Modifier } from "@dnd-kit/core";

/**
 * Keeps a dragged row on its column (vertical lists only).
 */
export const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });
