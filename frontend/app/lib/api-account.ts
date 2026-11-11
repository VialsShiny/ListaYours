import { API_BASE, ApiError, apiFetch, detailToMessage, type ApiErrorBody } from "@/lib/api";
import { voice } from "@/content/voice";
import type { ProfilePatch, User } from "@/lib/types";

export function fetchAccount(token: string, signal?: AbortSignal): Promise<User> {
  return apiFetch<User>("/api/account", { token, signal });
}

export function updateProfile(token: string, patch: ProfilePatch): Promise<User> {
  return apiFetch<User>("/api/account", { method: "PATCH", token, body: patch });
}

export function changePassword(token: string, current: string, next: string): Promise<void> {
  return apiFetch<void>("/api/account/password", {
    method: "POST",
    token,
    body: { current_password: current, new_password: next },
  });
}

export function uploadAvatar(token: string, image: Blob): Promise<User> {
  return apiFetch<User>("/api/account/avatar", { method: "PUT", token, body: image });
}

export function deleteAvatar(token: string): Promise<User> {
  return apiFetch<User>("/api/account/avatar", { method: "DELETE", token });
}

/**
 * Reads the signed-in user's picture as a Blob (the API only serves it with the Bearer token).
 */
export async function fetchAvatar(token: string, signal?: AbortSignal): Promise<Blob> {
  const response = await fetch(`${API_BASE}/api/account/avatar`, {
    headers: { Accept: "image/webp,image/*", Authorization: `Bearer ${token}` },
    signal,
  });
  if (!response.ok) {
    let body: ApiErrorBody = null;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      body = null;
    }
    throw new ApiError(response.status, body, detailToMessage(body, voice.errors.loadFailed));
  }
  return response.blob();
}
