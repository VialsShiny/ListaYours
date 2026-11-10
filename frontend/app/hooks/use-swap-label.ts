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
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (label === shown) return;
    if (prefersReducedMotion()) {
      setShown(label);
      return;
    }
    setSwapping(true);
    const half = MOTION.swap / 2;
    timers.current.push(window.setTimeout(() => setShown(label), half));
    timers.current.push(window.setTimeout(() => setSwapping(false), MOTION.swap));
    return () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current = [];
    };
  }, [label, shown]);

  return { shown, swapping };
}
