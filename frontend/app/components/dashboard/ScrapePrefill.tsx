"use client";

import { useState } from "react";
import ProductCard from "@/components/ProductCard";
import ResultRawViewer from "@/components/ResultRawViewer";
import { StatusMessage } from "@/components/feedback/StatusMessage";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
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
 * "Pré-remplir depuis une URL" row: calls the scraper, previews the product and fills the form.
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

  return (
    <section aria-labelledby="prefill-title" className="panel flex flex-col gap-4 bg-surface-2 p-4">
      <h3 id="prefill-title" className="eyebrow">
        Pré-remplir depuis une URL
      </h3>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <Field id="scrape-url" label="Adresse du produit">
          {(describedBy) => (
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
              aria-describedby={describedBy}
            />
          )}
        </Field>
        <Field id="scrape-strategy" label="Stratégie">
          {(describedBy) => (
            <Select
              id="scrape-strategy"
              value={strategy}
              disabled={loading}
              onChange={(event) => setStrategy(event.target.value as ScrapeStrategy)}
              aria-describedby={describedBy}
            >
              <option value="HTTPX">HTTPX</option>
              <option value="PLAYWRIGHT">PLAYWRIGHT</option>
            </Select>
          )}
        </Field>
        <Button variant="primary" disabled={loading || url.trim() === ""} onClick={handleAnalyse}>
          {loading ? "Analyse…" : "Analyser"}
        </Button>
      </div>
      <StatusMessage
        message={
          state.phase === "loading"
            ? SCRAPE_PROGRESS_MESSAGE
            : state.phase === "error"
              ? state.message
              : state.phase === "success"
                ? "Produit analysé : le formulaire a été pré-rempli."
                : null
        }
        tone={state.phase === "error" ? "error" : "info"}
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
