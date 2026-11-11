"use client";

import { useEffect, type RefObject } from "react";
import { MOTION, hasFinePointer, prefersReducedMotion } from "@/lib/motion";

/**
 * Makes the ghost word inside `container` drift towards the mouse (60px at most) with a small
 * lerp per frame. Desktop pointers only; nothing runs under reduced motion.
 */
export function useGhostParallax(container: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = container.current;
    if (!root || prefersReducedMotion() || !hasFinePointer()) return;
    const ghost = root.querySelector<HTMLElement>(".ghost-word");
    if (!ghost) return;

    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let frame = 0;

    const tick = () => {
      x += (targetX - x) * MOTION.ghostLerp;
      y += (targetY - y) * MOTION.ghostLerp;
      ghost.style.setProperty("--gx", `${x.toFixed(2)}px`);
      ghost.style.setProperty("--gy", `${y.toFixed(2)}px`);
      frame = Math.abs(targetX - x) + Math.abs(targetY - y) > 0.2 ? requestAnimationFrame(tick) : 0;
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      targetX = Math.max(-1, Math.min(1, nx * 2)) * MOTION.ghostMax;
      targetY = Math.max(-1, Math.min(1, ny * 2)) * MOTION.ghostMax;
      schedule();
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      schedule();
    };

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [container]);
}
