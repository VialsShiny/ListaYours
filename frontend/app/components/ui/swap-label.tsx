"use client";

import { useSwapLabel } from "@/hooks/use-swap-label";
import { cn } from "@/lib/utils";

type SwapLabelProps = { label: string; className?: string };

/**
 * Button content that crossfades (200ms, slight blur) when its text changes. Give the button a
 * fixed `min-width` so the layout does not jump between states. The outcome itself is announced
 * by the toast, not by this label.
 */
export function SwapLabel({ label, className }: SwapLabelProps) {
  const { shown, swapping } = useSwapLabel(label);
  return <span className={cn("swap-label", swapping && "is-swapping", className)}>{shown}</span>;
}
