"use client";

import { useRef, useState } from "react";
import ResultRawViewer from "@/components/ResultRawViewer";
import ProductCard from "@/components/ProductCard";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<boolean>(false);
  const strategy = useRef<HTMLSelectElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const chosenStrategy = strategy.current?.value || "HTTPX";
      const res = await fetch(`${apiUrl}/api/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, strategy: chosenStrategy, debug: debug }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "Une erreur est survenue lors du scraping.");
      }
    } catch (err: any) {
      setError(err.message || "Erreur de connexion au serveur API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="fixed left-4 bottom-4 z-50 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-2xl shadow-slate-900/5 backdrop-blur-xl sm:left-6 sm:bottom-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-sm shadow-slate-900/5">
            <span className="font-medium">Stratégie</span>
            <select
              name="strategy"
              id="select_strategy"
              ref={strategy}
              defaultValue="HTTPX"
              className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="HTTPX">HTTPX</option>
              <option value="PLAYWRIGHT">PLAYWRIGHT</option>
            </select>
          </label>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-sm shadow-slate-900/5">
            <span className="font-medium">Debug</span>
            <button
              type="button"
              onClick={() => setDebug((v) => !v)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full border transition ${debug ? 'border-blue-500 bg-blue-600' : 'border-slate-300 bg-slate-200'}`}
              aria-pressed={debug}
            >
              <span
                className={`absolute left-1 h-6 w-6 rounded-full bg-white shadow-sm transition-all ${debug ? 'translate-x-6' : 'translate-x-0'}`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white/90 p-8 shadow-xl shadow-slate-900/5 mb-6">
        <div className="mb-8 space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            ListaYours Scraper
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-slate-600">
            Entrez l'URL d'un produit e-commerce pour en extraire automatiquement les informations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <label className="sr-only" htmlFor="product-url">
            URL du produit
          </label>
          <input
            id="product-url"
            type="url"
            required
            placeholder="https://www.amazon.fr/dp/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-3xl bg-sky-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Scraping..." : "Scraper"}
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800 shadow-sm shadow-rose-100">
          <strong>Erreur :</strong> {error}
        </div>
      )}

      {loading && (
        <div className="mt-4 flex justify-center py-16">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-sky-500" />
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-y-6">
          <ResultRawViewer json={result.data} />
          <ProductCard json={result.data} />
        </div>
      )}
    </main>
  );
}