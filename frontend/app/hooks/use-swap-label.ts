"use client";

import { useEffect, useRef, useState } from "react";
import { MOTION, prefersReducedMotion } from "@/lib/motion";

/**
 * Crossfades a button label: when `label` changes, the old text blurs and fades for half the
 * swap, then the new text fades in. Returns the text to render and whether it is mid-swap.
 * Under reduced motion the label swaps at once.
 */
export function useSwapLabel(label: string) {
  const [shown, setShown] = useState(label);
  const [swapping, setSwapping] = useState(false);
  const shownRef = useRef(label);

  useEffect(() => {
    if (label === shownRef.current) return;
    if (prefersReducedMotion()) {
      shownRef.current = label;
      setShown(label);
      return;
    }
    setSwapping(true);
    const half = window.setTimeout(() => {
      shownRef.current = label;
      setShown(label);
    }, MOTION.swap / 2);
    const end = window.setTimeout(() => setSwapping(false), MOTION.swap);
    return () => {
      window.clearTimeout(half);
      window.clearTimeout(end);
      shownRef.current = label;
      setShown(label);
      setSwapping(false);
    };
  }, [label]);

  return { shown, swapping };
}
