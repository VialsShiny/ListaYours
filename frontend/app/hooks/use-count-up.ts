"use client";

import { useEffect, useRef, useState } from "react";
import { MOTION, easeOut, prefersReducedMotion } from "@/lib/motion";

/**
 * Animates a number from 0 (then from its previous value) to `target` over 900ms with an
 * ease-out curve (requestAnimationFrame). Under reduced motion the value jumps.
 */
export function useCountUp(target: number): number {
  const [value, setValue] = useState(0);
  const previous = useRef(0);

  useEffect(() => {
    const from = previous.current;
    previous.current = target;
    if (from === target) return;
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = easeOut((now - start) / MOTION.countUp);
      setValue(from + (target - from) * progress);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return value;
}
