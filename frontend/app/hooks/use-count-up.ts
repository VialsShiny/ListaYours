"use client";

import { useEffect, useRef, useState } from "react";
import { MOTION, easeOut, prefersReducedMotion } from "@/lib/motion";

/**
 * Animates a number from the value currently shown (0 on first display) to `target` over
 * 900ms with an ease-out curve (requestAnimationFrame). Under reduced motion the value jumps.
 */
export function useCountUp(target: number): number {
  const [value, setValue] = useState(0);
  const shown = useRef(0);

  useEffect(() => {
    const from = shown.current;
    if (from === target) return;
    if (prefersReducedMotion()) {
      shown.current = target;
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = easeOut((now - start) / MOTION.countUp);
      shown.current = from + (target - from) * progress;
      setValue(shown.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return value;
}
