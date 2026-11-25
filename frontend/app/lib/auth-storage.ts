import type { User, UserRole } from "@/lib/types";

export const USER_KEY = "listayours.user";

const ROLES: readonly UserRole[] = ["owner", "visitor"];

/**
 * The session itself lives in an httpOnly cookie the browser sends on its own; only the public
 * profile is cached here so the header can render before `/api/auth/me` answers.
 */
function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readUser(): User | null {
  const raw = storage()?.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<User>;
    if (!parsed || typeof parsed !== "object" || !parsed.email) return null;
    if (!ROLES.includes(parsed.role as UserRole)) return null;
    return parsed as User;
  } catch {
    return null;
  }
}

export function writeUser(user: User): void {
  try {
    storage()?.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    return;
  }
}

export function clearUser(): void {
  try {
    storage()?.removeItem(USER_KEY);
  } catch {
    return;
  }
}
