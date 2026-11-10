import { prefersReducedMotion } from "@/lib/motion";

const COLORS = ["#0d0d0d", "#cf3328", "#9a9a9a"];

/**
 * One burst of black, red and grey confetti for the visitor who just reserved a gift.
 * The library is loaded on demand and nothing fires under reduced motion.
 */
export async function fireReservationConfetti(): Promise<boolean> {
  if (typeof window === "undefined" || prefersReducedMotion()) return false;
  const { default: confetti } = await import("canvas-confetti");
  void confetti({
    particleCount: 90,
    spread: 70,
    startVelocity: 38,
    gravity: 1.1,
    ticks: 180,
    origin: { x: 0.5, y: 0.7 },
    colors: COLORS,
    disableForReducedMotion: true,
  });
  return true;
}
