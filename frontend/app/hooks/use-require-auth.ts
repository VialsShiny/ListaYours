"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

/**
 * Redirects anonymous users to `/connexion?next=<current path>` once the session is known.
 */
export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (auth.status === "anonymous") {
      router.replace(`/connexion?next=${encodeURIComponent(pathname || "/")}`);
    }
  }, [auth.status, pathname, router]);

  return auth;
}
