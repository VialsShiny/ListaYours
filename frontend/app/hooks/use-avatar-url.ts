"use client";

import { useEffect, useState } from "react";
import { fetchAvatar } from "@/lib/api-account";
import type { User } from "@/lib/types";

const cache = new Map<string, Promise<string>>();

/**
 * Drops every cached picture and revokes its object URL, so nothing of the previous account
 * stays reachable after sign-out.
 */
export function forgetAvatarUrls(): void {
  for (const pending of cache.values()) {
    pending.then((objectUrl) => URL.revokeObjectURL(objectUrl)).catch(() => undefined);
  }
  cache.clear();
}

/**
 * Object URL of the signed-in user's picture, fetched once per picture version and shared
 * between the header and the account page. `null` while loading or when there is no picture.
 */
export function useAvatarUrl(user: User | null): string | null {
  const key = user?.has_avatar ? `${user.id}:${user.avatar_updated_at}` : null;
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!key) {
      setUrl(null);
      return;
    }
    let active = true;
    let pending = cache.get(key);
    if (!pending) {
      pending = fetchAvatar().then((blob) => URL.createObjectURL(blob));
      cache.set(key, pending);
      pending.catch(() => cache.delete(key));
    }
    pending
      .then((objectUrl) => {
        if (active) setUrl(objectUrl);
      })
      .catch(() => {
        if (active) setUrl(null);
      });
    return () => {
      active = false;
    };
  }, [key]);

  return url;
}
