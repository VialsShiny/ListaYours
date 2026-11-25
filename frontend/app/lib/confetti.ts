import { getInputModality } from "@/hooks/use-input-modality";
import { prefersReducedMotion, shouldMove } from "@/lib/motion";

const COLOR_TOKENS = ["--ink", "--accent", "--soft"];

function themeColors(): string[] {
  const style = getComputedStyle(document.documentElement);
  return COLOR_TOKENS.map((token) => style.getPropertyValue(token).trim()).filter(Boolean);
}

/**
 * One burst of ink, accent and grey confetti (read from the current theme tokens) for the visitor who just reserved a gift.
 * The library is loaded on demand; nothing fires under reduced motion or after a keyboard action.
 */
export async function fireReservationConfetti(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!shouldMove(prefersReducedMotion(), getInputModality())) return false;
  const { default: confetti } = await import("canvas-confetti");
  void confetti({
    particleCount: 90,
    spread: 70,
    startVelocity: 38,
    gravity: 1.1,
    ticks: 180,
    origin: { x: 0.5, y: 0.7 },
    colors: themeColors(),
    disableForReducedMotion: true,
  });
  return true;
}
