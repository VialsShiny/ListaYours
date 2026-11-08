"use client";

import { useCallback, useState } from "react";
import { useAsync } from "@/hooks/use-async";
import { useAuth } from "@/hooks/use-auth";
import { fetchOwnerData } from "@/lib/api-owner";
import { errorMessage } from "@/lib/api";
import type { OwnerData } from "@/lib/types";

export type OwnerStore = ReturnType<typeof useOwnerData>;

/**
 * Loads the owner dashboard data and exposes `run`, which executes a mutation,
 * refetches on success and surfaces a French error otherwise.
 */
export function useOwnerData() {
  const { token, isOwner, status } = useAuth();
  const enabled = status !== "loading" && isOwner && Boolean(token);
  const state = useAsync<OwnerData>(
    (signal) => fetchOwnerData(token ?? "", signal),
    token ?? "no-token",
    enabled,
  );
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const run = useCallback(
    async (mutation: (token: string) => Promise<unknown>, fallback: string) => {
      if (!token) return false;
      setBusy(true);
      setActionError(null);
      try {
        await mutation(token);
        state.refetch();
        return true;
      } catch (error) {
        setActionError(errorMessage(error, fallback));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [token, state],
  );

  return {
    ...state,
    token,
    busy,
    actionError,
    clearActionError: () => setActionError(null),
    run,
  };
}
