"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";

type HoldButtonProps = {
  label: string;
  holdLabel: string;
  onConfirm: () => void;
  onFallback: () => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Hold-to-confirm destructive action: the accent fill sweeps across for 1.2s (clip-path) and
 * the action fires only if the pointer, Space or Enter is still held at the end. Releasing
 * early retracts the fill in 200ms. A plain click with no hold (assistive technologies) goes to
 * `onFallback`, which should open a confirmation dialog.
 */
export function HoldButton({
  label,
  holdLabel,
  onConfirm,
  onFallback,
  disabled,
  className,
}: HoldButtonProps) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | null>(null);
  const fired = useRef(false);
  const interacted = useRef(false);

  const stop = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  }, []);

  const start = useCallback(() => {
    interacted.current = true;
    if (disabled || timer.current) return;
    fired.current = false;
    setHolding(true);
    timer.current = window.setTimeout(() => {
      fired.current = true;
      stop();
      onConfirm();
    }, MOTION.hold);
  }, [disabled, onConfirm, stop]);

  useEffect(() => stop, [stop]);

  useEffect(() => {
    if (disabled) stop();
  }, [disabled, stop]);

  return (
    <button
      type="button"
      className={cn("btn btn-text btn-text-accent hold", className)}
      style={
        {
          "--hold-ms": `${MOTION.hold}ms`,
          "--hold-release-ms": `${MOTION.holdRelease}ms`,
        } as React.CSSProperties
      }
      aria-label={holdLabel}
      aria-disabled={disabled || undefined}
      data-holding={holding ? "true" : undefined}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        start();
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if (event.repeat) return;
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          start();
        }
      }}
      onKeyUp={(event) => {
        if (event.key === " " || event.key === "Enter") stop();
      }}
      onBlur={stop}
      onClick={(event) => {
        event.preventDefault();
        const held = interacted.current || fired.current;
        interacted.current = false;
        fired.current = false;
        if (disabled || held) return;
        onFallback();
      }}
    >
      <span className="hold-label">{label}</span>
      <span className="hold-fill" aria-hidden="true">
        <span className="hold-fill-label">{label}</span>
      </span>
    </button>
  );
}
