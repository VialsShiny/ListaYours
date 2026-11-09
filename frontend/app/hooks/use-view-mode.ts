"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type ViewMode = "naviguer" | "grille";

export const VIEW_PARAM = "vue";
const STORAGE_KEY = "listayours:vue";

/**
 * Narrows any string to a view mode, defaulting to "naviguer".
 */
export function parseViewMode(value: string | null | undefined): ViewMode {
  return value === "grille" ? "grille" : "naviguer";
}

/**
 * The list view lives in the URL (`?vue=naviguer|grille`) and is mirrored in localStorage,
 * so a returning visitor without the parameter gets their last choice back.
 */
export function useViewMode() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const param = searchParams.get(VIEW_PARAM);
  const view = parseViewMode(param);

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
      try {
        window.localStorage.setItem(STORAGE_KEY, view);
      } catch {
        return;
      }
      return;
    }
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (stored === "grille") router.replace(hrefFor("grille"), { scroll: false });
  }, [param, view, router, hrefFor]);

  return { view, hrefFor };
}
