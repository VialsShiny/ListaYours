/**
 * Returns the normalised URL when `value` is an absolute http(s) URL, `null` otherwise, so a
 * shop link or product photo can never carry `javascript:`, `data:` or a relative path.
 */
export function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
