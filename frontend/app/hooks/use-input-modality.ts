"use client";

import { useEffect } from "react";
import type { InputModality } from "@/lib/motion";

export const MODALITY_ATTRIBUTE = "data-modality";
const KEYBOARD_KEYS = new Set([
  "Tab",
  "Enter",
  " ",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Escape",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

let current: InputModality = "pointer";

/**
 * Last input method used on the page. Keyboard-initiated actions must not animate, so the
 * value is also mirrored on `<html data-modality>` for CSS (`--move-ui` drops to 0).
 */
export function getInputModality(): InputModality {
  return current;
}

function setModality(next: InputModality) {
  if (current === next) return;
  current = next;
  document.documentElement.setAttribute(MODALITY_ATTRIBUTE, next);
}

/**
 * Mounts the document-level listeners once (used by the site shell).
 */
export function useInputModalityTracker() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (KEYBOARD_KEYS.has(event.key)) setModality("keyboard");
    };
    const onPointer = () => setModality("pointer");
    document.documentElement.setAttribute(MODALITY_ATTRIBUTE, current);
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onPointer, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onPointer, true);
    };
  }, []);
}
