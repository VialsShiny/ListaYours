import { apiFetch, parseError } from "@/lib/api";
import { voice } from "@/content/voice";
import type { ProfilePatch, User } from "@/lib/types";

export function updateProfile(patch: ProfilePatch): Promise<User> {
  return apiFetch<User>("/api/account", { method: "PATCH", session: true, body: patch });
}

export function changePassword(current: string, next: string): Promise<void> {
  return apiFetch<void>("/api/account/password", {
    method: "POST",
    session: true,
    body: { current_password: current, new_password: next },
  });
}

export function uploadAvatar(image: Blob): Promise<User> {
  return apiFetch<User>("/api/account/avatar", { method: "PUT", session: true, body: image });
}

export function deleteAvatar(): Promise<User> {
  return apiFetch<User>("/api/account/avatar", { method: "DELETE", session: true });
}

/**
 * Reads the signed-in user's picture as a Blob (the API serves it to the session cookie only).
 */
export async function fetchAvatar(signal?: AbortSignal): Promise<Blob> {
  const response = await fetch("/api/account/avatar", {
    headers: { Accept: "image/webp,image/*" },
    signal,
  });
  if (!response.ok) throw await parseError(response, voice.errors.loadFailed);
  return response.blob();
}
