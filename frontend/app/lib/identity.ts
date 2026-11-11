import { voice } from "@/content/voice";
import type { UserRole } from "@/lib/types";

/**
 * French label for a role; unknown values fall back to the guest label, never to raw data.
 */
export function roleLabel(role: UserRole | string): string {
  return role === "owner" ? voice.account.roles.owner : voice.account.roles.visitor;
}

/**
 * First character of a display name, upper-cased (handles accents and astral characters).
 */
export function initialOf(name: string): string {
  const first = Array.from(name.trim())[0];
  return first ? first.toLocaleUpperCase("fr") : "?";
}
