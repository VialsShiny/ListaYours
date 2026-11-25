import { apiFetch } from "@/lib/api";
import type { AuthResponse, User } from "@/lib/types";

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function register(
  email: string,
  password: string,
  displayName: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: { email, password, display_name: displayName },
  });
}

export function logout(): Promise<void> {
  return apiFetch<void>("/api/auth/logout", { method: "POST" });
}

export function fetchMe(signal?: AbortSignal): Promise<User> {
  return apiFetch<User>("/api/auth/me", { session: true, signal });
}
