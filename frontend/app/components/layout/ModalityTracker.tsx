"use client";

import { useInputModalityTracker } from "@/hooks/use-input-modality";

/**
 * Renders nothing; keeps `<html data-modality>` in sync with the last input method.
 */
export function ModalityTracker() {
  useInputModalityTracker();
  return null;
}
