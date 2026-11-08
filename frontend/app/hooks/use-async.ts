"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "@/lib/api";

export type AsyncState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  refetch: () => void;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
};

/**
 * Runs `load` on mount and whenever `key` changes, aborting stale requests.
 * `enabled: false` keeps the hook idle (used while the session is still loading).
 */
export function useAsync<T>(
  load: (signal: AbortSignal) => Promise<T>,
  key: string,
  enabled = true,
): AsyncState<T> {
  const loadRef = useRef(load);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    loadRef
      .current(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
        setLoading(false);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setError(errorMessage(caught, "Le chargement a échoué."));
        setLoading(false);
      });
    return () => controller.abort();
  }, [key, version, enabled]);

  const refetch = useCallback(() => setVersion((current) => current + 1), []);

  return { data, error, loading, refetch, setData };
}
