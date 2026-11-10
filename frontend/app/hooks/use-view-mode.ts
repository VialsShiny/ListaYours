"use client";

import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getInputModality } from "@/hooks/use-input-modality";
import { prefersReducedMotion, shouldMove } from "@/lib/motion";

export type ViewMode = "naviguer" | "grille";

export const VIEW_PARAM = "vue";
const STORAGE_KEY = "listayours:vue";

/**
 * Narrows any string to a view mode, defaulting to "naviguer".
 */
export function parseViewMode(value: string | null | undefined): ViewMode {
  return value === "grille" ? "grille" : "naviguer";
}

function remember(mode: ViewMode) {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    return;
  }
}

/**
 * The list view lives in the URL (`?vue=naviguer|grille`) and is mirrored in localStorage,
 * so a returning visitor without the parameter gets their last choice back. `switchTo`
 * swaps the rendered view inside a View Transition (crossfade, skipped under reduced motion
 * and for keyboard-initiated changes) before updating the URL.
 */
export function useViewMode() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const param = searchParams.get(VIEW_PARAM);
  const [view, setView] = useState<ViewMode>(() => parseViewMode(param));

  const hrefFor = useCallback(
    (mode: ViewMode) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(VIEW_PARAM, mode);
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams],
  );

  useEffect(() => {
    if (param) {
      setView(parseViewMode(param));
      remember(parseViewMode(param));
      return;
    }
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (stored === "grille") router.replace(hrefFor("grille"), { scroll: false });
  }, [param, router, hrefFor]);

  const switchTo = useCallback(
    (mode: ViewMode) => {
      const apply = () => flushSync(() => setView(mode));
      const animate = shouldMove(prefersReducedMotion(), getInputModality());
      if (animate && typeof document.startViewTransition === "function") {
        document.startViewTransition(apply);
      } else {
        apply();
      }
      remember(mode);
      router.replace(hrefFor(mode), { scroll: false });
    },
    [router, hrefFor],
  );

  return { view, hrefFor, switchTo };
}
