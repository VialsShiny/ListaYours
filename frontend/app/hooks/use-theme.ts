"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyThemeSetting,
  readThemeSetting,
  THEME_EVENT,
  watchSystemTheme,
  type ThemeSetting,
} from "@/lib/theme";

/**
 * The stored theme choice and its setter; every switch on the page stays in sync.
 */
export function useTheme(): [ThemeSetting, (next: ThemeSetting) => void] {
  const [setting, setSetting] = useState<ThemeSetting>("system");

  useEffect(() => {
    setSetting(readThemeSetting());
    const onTheme = (event: Event) => setSetting((event as CustomEvent<ThemeSetting>).detail);
    const onSystem = () => applyThemeSetting(readThemeSetting());
    window.addEventListener(THEME_EVENT, onTheme);
    const stop = watchSystemTheme(onSystem);
    return () => {
      window.removeEventListener(THEME_EVENT, onTheme);
      stop();
    };
  }, []);

  const set = useCallback((next: ThemeSetting) => applyThemeSetting(next), []);
  return [setting, set];
}
