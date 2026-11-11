"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, UNAUTHORIZED_EVENT } from "@/lib/api";
import { fetchMe } from "@/lib/api-auth";
import { clearSession, readToken, readUser, writeSession } from "@/lib/auth-storage";
import type { User } from "@/lib/types";

export type AuthStatus = "loading" | "anonymous" | "authenticated";

export type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  token: string | null;
  isOwner: boolean;
  isVisitor: boolean;
  signIn: (token: string, user: User) => void;
  updateUser: (user: User) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Holds the session read from localStorage and re-validates it once against `/api/auth/me`.
 * Any 401 answered to an authenticated call (event from `apiFetch`) clears the session;
 * a network failure keeps the stored user so the UI stays usable.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = readToken();
    const storedUser = readUser();
    if (!storedToken) {
      clearSession();
      setStatus("anonymous");
      return;
    }
    setToken(storedToken);
    setUser(storedUser);
    setStatus(storedUser ? "authenticated" : "loading");

    const controller = new AbortController();
    fetchMe(storedToken, controller.signal)
      .then((freshUser) => {
        writeSession(storedToken, freshUser);
        setUser(freshUser);
        setStatus("authenticated");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          clearSession();
          setToken(null);
          setUser(null);
          setStatus("anonymous");
          return;
        }
        setStatus(storedUser ? "authenticated" : "anonymous");
      });
    return () => controller.abort();
  }, []);

  const signIn = useCallback((nextToken: string, nextUser: User) => {
    writeSession(nextToken, nextUser);
    setToken(nextToken);
    setUser(nextUser);
    setStatus("authenticated");
  }, []);

  const updateUser = useCallback((nextUser: User) => {
    const currentToken = readToken();
    if (currentToken) writeSession(currentToken, nextUser);
    setUser(nextUser);
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, signOut);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, signOut);
  }, [signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      token,
      isOwner: status === "authenticated" && user?.role === "owner",
      isVisitor: status === "authenticated" && user?.role === "visitor",
      signIn,
      updateUser,
      signOut,
    }),
    [status, user, token, signIn, updateUser, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé dans un AuthProvider.");
  return context;
}
