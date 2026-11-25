"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, UNAUTHORIZED_EVENT } from "@/lib/api";
import { fetchMe, logout } from "@/lib/api-auth";
import { clearUser, readUser, writeUser } from "@/lib/auth-storage";
import type { User } from "@/lib/types";

export type AuthStatus = "loading" | "anonymous" | "authenticated";

export type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  isOwner: boolean;
  isVisitor: boolean;
  signIn: (user: User) => void;
  updateUser: (user: User) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * The session is an httpOnly cookie: the provider asks `/api/auth/me` once, rendering the cached
 * profile meanwhile. A 401 answered to a session call (event from `apiFetch`) ends the session;
 * a network failure keeps the cached user so the UI stays usable.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const cachedUser = readUser();
    setUser(cachedUser);
    const controller = new AbortController();
    fetchMe(controller.signal)
      .then((freshUser) => {
        writeUser(freshUser);
        setUser(freshUser);
        setStatus("authenticated");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          clearUser();
          setUser(null);
          setStatus("anonymous");
          return;
        }
        setStatus(cachedUser ? "authenticated" : "anonymous");
      });
    return () => controller.abort();
  }, []);

  const signIn = useCallback((nextUser: User) => {
    writeUser(nextUser);
    setUser(nextUser);
    setStatus("authenticated");
  }, []);

  const updateUser = useCallback((nextUser: User) => {
    writeUser(nextUser);
    setUser(nextUser);
  }, []);

  const forget = useCallback(() => {
    clearUser();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const signOut = useCallback(() => {
    forget();
    logout().catch(() => undefined);
  }, [forget]);

  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, forget);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, forget);
  }, [forget]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      isOwner: status === "authenticated" && user?.role === "owner",
      isVisitor: status === "authenticated" && user?.role === "visitor",
      signIn,
      updateUser,
      signOut,
    }),
    [status, user, signIn, updateUser, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé dans un AuthProvider.");
  return context;
}
