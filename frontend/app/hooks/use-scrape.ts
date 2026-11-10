"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { voice } from "@/content/voice";
import { useAuth } from "@/hooks/use-auth";
import { errorMessage } from "@/lib/api";
import { scrapeProduct } from "@/lib/api-owner";
import type { ProductData, ScrapeStrategy } from "@/lib/types";

export const SCRAPE_PROGRESS_MESSAGE = voice.dashboard.gifts.scraping;
const SCRAPE_TIMEOUT_MS = 95_000;

export type ScrapeState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "success"; data: ProductData; sourceUrl: string }
  | { phase: "error"; message: string };

export function useScrape() {
  const { token } = useAuth();
  const [state, setState] = useState<ScrapeState>({ phase: "idle" });
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const analyse = useCallback(
    async (url: string, strategy: ScrapeStrategy) => {
      if (!token) {
        setState({ phase: "error", message: voice.errors.ownerOnly });
        return null;
      }
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const timer = window.setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);
      setState({ phase: "loading" });
      try {
        const response = await scrapeProduct(token, url, strategy, controller.signal);
        if (response.success && response.data) {
          setState({ phase: "success", data: response.data, sourceUrl: url });
          return response.data;
        }
        setState({
          phase: "error",
          message: response.error ?? voice.dashboard.gifts.scrapeEmpty,
        });
        return null;
      } catch (error) {
        if (controllerRef.current !== controller) return null;
        if (controller.signal.aborted) {
          setState({ phase: "error", message: voice.dashboard.gifts.scrapeTimeout });
        } else {
          setState({
            phase: "error",
            message: errorMessage(error, voice.dashboard.gifts.scrapeFailed),
          });
        }
        return null;
      } finally {
        window.clearTimeout(timer);
      }
    },
    [token],
  );

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState({ phase: "idle" });
  }, []);

  return { state, analyse, reset };
}
