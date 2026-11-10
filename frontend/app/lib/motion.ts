export type InputModality = "pointer" | "keyboard";

export const MOTION = {
  press: 160,
  toggle: 200,
  dialog: 180,
  drawerIn: 320,
  drawerOut: 200,
  switch: 260,
  progress: 220,
  cascade: 300,
  cascadeStep: 50,
  cascadeMax: 12,
  lift: 200,
  swap: 200,
  hold: 1200,
  holdRelease: 200,
  shake: 320,
  countUp: 900,
  reveal: 560,
  revealStep: 80,
  ghostMax: 60,
  ghostLerp: 0.12,
} as const;

export const EASE = {
  out: "cubic-bezier(0.23, 1, 0.32, 1)",
  drawer: "cubic-bezier(0.32, 0.72, 0, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
export const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

/**
 * True when the user asked the OS for less motion. Safe on the server (returns false).
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * True on devices with a mouse-like pointer; hover and mouse-tracking effects only run there.
 */
export function hasFinePointer(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(FINE_POINTER_QUERY).matches;
}

/**
 * Movement is allowed only without reduced motion and never for a keyboard-initiated action.
 */
export function shouldMove(reduced: boolean, modality: InputModality = "pointer"): boolean {
  return !reduced && modality !== "keyboard";
}

/**
 * Inline style for the n-th item of a cascade (50ms steps, capped so long lists stay snappy).
 */
export function cascadeStyle(index: number): React.CSSProperties {
  return { "--i": Math.min(Math.max(index, 0), MOTION.cascadeMax) } as React.CSSProperties;
}

/**
 * Standard ease-out curve (cubic) for JavaScript-driven animations.
 */
export function easeOut(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - clamped, 3);
}
