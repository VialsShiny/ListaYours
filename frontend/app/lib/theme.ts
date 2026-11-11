export type ThemeSetting = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_KEY = "listayours.theme";
export const THEME_ATTRIBUTE = "data-theme";
export const THEME_EVENT = "listayours:theme";
export const THEME_SETTINGS: ThemeSetting[] = ["system", "light", "dark"];
export const THEME_COLORS: Record<ResolvedTheme, string> = { light: "#fafafa", dark: "#121212" };
const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Inline script for `<head>`: applies a stored explicit choice before the first paint.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var v=localStorage.getItem("${THEME_KEY}");if(v==="light"||v==="dark"){document.documentElement.setAttribute("${THEME_ATTRIBUTE}",v)}}catch(e){}})();`;

/**
 * Narrows any stored value to a setting; anything unknown means "system".
 */
export function parseTheme(value: unknown): ThemeSetting {
  return value === "light" || value === "dark" ? value : "system";
}

/**
 * The theme actually shown for a setting, given the system preference.
 */
export function resolveTheme(setting: ThemeSetting, prefersDark: boolean): ResolvedTheme {
  if (setting === "system") return prefersDark ? "dark" : "light";
  return setting;
}

export function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia(DARK_QUERY).matches;
}

export function readThemeSetting(): ThemeSetting {
  try {
    return parseTheme(window.localStorage.getItem(THEME_KEY));
  } catch {
    return "system";
  }
}

/**
 * Writes the choice, mirrors it on `<html data-theme>` and the theme-color meta, and tells
 * every mounted switch.
 */
export function applyThemeSetting(setting: ThemeSetting): void {
  const root = document.documentElement;
  if (setting === "system") root.removeAttribute(THEME_ATTRIBUTE);
  else root.setAttribute(THEME_ATTRIBUTE, setting);
  const color = THEME_COLORS[resolveTheme(setting, systemPrefersDark())];
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute("content", color);
  });
  try {
    if (setting === "system") window.localStorage.removeItem(THEME_KEY);
    else window.localStorage.setItem(THEME_KEY, setting);
  } catch {
    return;
  }
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: setting }));
}

export function watchSystemTheme(onChange: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
