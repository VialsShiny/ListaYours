import type { User } from "@/lib/types";

export const TOKEN_KEY = "listayours.token";
export const USER_KEY = "listayours.user";

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readToken(): string | null {
  return storage()?.getItem(TOKEN_KEY) ?? null;
}

export function readUser(): User | null {
  const raw = storage()?.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<User>;
    if (!parsed || typeof parsed !== "object" || !parsed.email || !parsed.role) return null;
    return parsed as User;
  } catch {
    return null;
  }
}

export function writeSession(token: string, user: User): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(TOKEN_KEY, token);
    store.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    return;
  }
}

export function clearSession(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(TOKEN_KEY);
    store.removeItem(USER_KEY);
  } catch {
    return;
  }
}
