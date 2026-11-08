"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ClipboardStatus = "idle" | "copied" | "error";

export function useClipboard(resetAfterMs = 2500) {
  const [status, setStatus] = useState<ClipboardStatus>("idle");
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const copy = useCallback(
    async (text: string) => {
      try {
        if (!navigator.clipboard) throw new Error("clipboard indisponible");
        await navigator.clipboard.writeText(text);
        setStatus("copied");
      } catch {
        setStatus("error");
      }
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setStatus("idle"), resetAfterMs);
    },
    [resetAfterMs],
  );

  return { status, copy };
}
