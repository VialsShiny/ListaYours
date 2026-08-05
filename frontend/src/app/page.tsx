"use client";

import { useRef, useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const strategy = useRef<HTMLSelectElement | null>(null)
  const [debug, setDebug] = useState<boolean>(false)
  
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
    <main style={{ maxWidth: "900px", margin: "40px auto", padding: "0 20px" }}>
      <div style={{ position: 'fixed', left: 12, bottom: 12, zIndex: 50, display: 'flex', gap: 8, alignItems: 'center' }}>
        <select
          name="strategy"
          id="select_strategy"
          ref={strategy}
          defaultValue="httpx"
          style={{
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            background: "#ffffff",
          }}
        >
          <option value="HTTPX">HTTPX</option>
          <option value="PLAYWRIGHT">PLAYWRIGHT</option>
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p>Debug :</p>
          <button
            type="button"
            onClick={() => setDebug((v) => !v)}
            style={{
              position: 'relative',
              width: 56,
              height: 32,
              padding: 0,
              borderRadius: 999,
              border: '1px solid #d1d5db',
              background: debug ? '#2563eb' : '#e5e7eb',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 3,
                left: debug ? 'calc(100% - 27px)' : 3,
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                transition: 'left 0.2s ease',
              }}
            />
          </button>
        </div>
      </div>
      <h1 style={{ fontSize: "2rem", color: "#111827", marginBottom: "8px" }}>
        ListaYours Scraper
      </h1>
      <p style={{ color: "#4b5563", marginBottom: "24px" }}>
        Entrez l'URL d'un produit e-commerce pour en extraire automatiquement les informations.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "12px", marginBottom: "32px" }}>
        <input
          type="url"
          required
          placeholder="https://www.amazon.fr/dp/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            fontSize: "1rem",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: "#2563eb",
            color: "#ffffff",
            padding: "12px 24px",
            borderRadius: "6px",
            border: "none",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Scraping..." : "Scraper"}
        </button>
      </form>

      {error && (
        <div style={{ padding: "16px", backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: "6px", marginBottom: "24px" }}>
          <strong>Erreur :</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Résultat</h2>
            <span style={{ fontSize: "0.875rem", backgroundColor: "#e0e7ff", color: "#3730a3", padding: "4px 8px", borderRadius: "4px" }}>
              Stratégie : {result.strategy_used}
            </span>
          </div>
          <pre style={{ backgroundColor: "#1e293b", color: "#f8fafc", padding: "16px", borderRadius: "6px", overflowX: "auto" }}>
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}