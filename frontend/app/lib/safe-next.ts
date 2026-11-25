const PROBE_ORIGIN = "http://x.invalid";
const UNSAFE_CHARACTERS = /[\u0000-\u001F\u007F\\]/;

/**
 * Only accepts same-origin relative paths for the `?next=` redirect, defaulting to "/".
 * The value is parsed the way a browser would, so `//host`, `/\host` or a tab-split `/\t/host`
 * can never turn into another origin; the normalised path, query and fragment are returned.
 */
export function safeNextPath(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/") || UNSAFE_CHARACTERS.test(value)) return fallback;
  try {
    const url = new URL(value, PROBE_ORIGIN);
    if (url.origin !== PROBE_ORIGIN) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
