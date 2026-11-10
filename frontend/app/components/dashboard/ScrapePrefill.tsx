"use client";

import { useState } from "react";
import { voice } from "@/content/voice";
import ProductCard from "@/components/ProductCard";
import ResultRawViewer from "@/components/ResultRawViewer";
import { StatusMessage } from "@/components/feedback/StatusMessage";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { SCRAPE_PROGRESS_MESSAGE, useScrape } from "@/hooks/use-scrape";
import type { GiftFormValues } from "@/lib/gift-form";
import { prefillGiftFromProduct } from "@/lib/gift-prefill";
import type { ScrapeStrategy } from "@/lib/types";

type ScrapePrefillProps = {
  initialUrl: string;
  onPrefill: (apply: (current: GiftFormValues) => GiftFormValues) => void;
};

/**
 * "Pré-remplir depuis un lien produit": calls the scraper, previews the product, fills the form.
 */
export function ScrapePrefill({ initialUrl, onPrefill }: ScrapePrefillProps) {
  const [url, setUrl] = useState(initialUrl);
  const [strategy, setStrategy] = useState<ScrapeStrategy>("HTTPX");
  const { state, analyse } = useScrape();
  const loading = state.phase === "loading";

  async function handleAnalyse() {
    const trimmed = url.trim();
    if (!trimmed) return;
    const data = await analyse(trimmed, strategy);
    if (data) onPrefill((current) => prefillGiftFromProduct(data, trimmed, current));
  }

  const message =
    state.phase === "loading"
      ? SCRAPE_PROGRESS_MESSAGE
      : state.phase === "error"
        ? state.message
        : state.phase === "success"
          ? voice.dashboard.gifts.prefillDone
          : null;

  return (
    <section
      aria-labelledby="prefill-title"
      className="flex flex-col gap-2.5 rounded-[20px] border border-line bg-bg p-4 md:p-5"
    >
      <h3 id="prefill-title" className="field-label">
        {voice.dashboard.gifts.prefillTitle}
      </h3>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="scrape-url" className="sr-only">
          {voice.dashboard.gifts.prefillUrl}
        </label>
        <Input
          id="scrape-url"
          type="url"
          inputMode="url"
          placeholder="https://www.exemple.fr/produit"
          value={url}
          disabled={loading}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleAnalyse();
            }
          }}
          className="min-h-12 flex-1 text-[14px]"
        />
        <label htmlFor="scrape-strategy" className="sr-only">
          {voice.dashboard.gifts.prefillStrategy}
        </label>
        <Select
          id="scrape-strategy"
          value={strategy}
          disabled={loading}
          onChange={(event) => setStrategy(event.target.value as ScrapeStrategy)}
          className="min-h-12 w-auto text-[14px]"
        >
          <option value="HTTPX">HTTPX</option>
          <option value="PLAYWRIGHT">Playwright</option>
        </Select>
        <Button
          variant="primary"
          size="sm"
          className="min-h-12 shrink-0"
          disabled={loading || url.trim() === ""}
          onClick={handleAnalyse}
        >
          {loading ? voice.dashboard.gifts.filling : voice.dashboard.gifts.fill}
        </Button>
      </div>
      <StatusMessage
        message={message}
        tone={state.phase === "error" ? "error" : "info"}
        className="text-[14px]"
      />
      {state.phase === "success" ? (
        <div className="flex flex-col gap-3">
          <ProductCard product={state.data} />
          <ResultRawViewer json={state.data} />
        </div>
      ) : null}
    </section>
  );
}
