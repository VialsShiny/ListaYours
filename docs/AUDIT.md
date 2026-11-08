# Stage 1 audit — real stack and scraper behavior (2026-11-08)

## Stack actually present in the repository

| Area | Observed |
|------|----------|
| API | FastAPI 0.109, Pydantic 2.5.3, httpx 0.26, Playwright 1.41 (Chromium), BeautifulSoup 4.12, extruct 0.16, lxml 4.9.4. Entry point `api/app/main.py`, schemas in `api/app/models.py`. Single endpoint `POST /api/scrape` plus `GET /health`. CORS restricted to `http://localhost:3000`. |
| Scraper | `app/scraper/engine.py` (fetch orchestration), `parser.py` (`extract_all_data`), `parsers/{amazon,aliexpress,default}.py`, `utils/{parsing,text,url}.py`, `constants/keywords.py`. |
| Frontend | Next.js 14.2, React 18.3, TypeScript 5, Tailwind 4 (via `@tailwindcss/postcss`), shadcn (base-ui style), lucide-react. Only a scraper playground page (`app/page.tsx`). `@/*` alias maps to `./app/*`. |
| Infra | `docker-compose.yml` (api + frontend, dev mode), `api/Dockerfile` (single stage, Playwright deps), `frontend/Dockerfile` (dev server), `.env.example`. No tests, no CI, no Makefile, no commitlint. |
| Host | Python 3.14 only (3.11 installed with `uv`), Node 26, Docker Desktop (3.8 GB RAM for containers). |

## Scraper behavior (recorded, frozen by `api/tests/scraper`)

- Input: `{"url": HttpUrl, "strategy": "HTTPX" | "PLAYWRIGHT", "debug": bool}`.
- Output schema: `ScrapeResponse { success, data: ProductData | null, error, strategy_used, debug }` where `ProductData` has
  `product_url, canonical_url, title, price (string), old_price, discount, currency, description, images[], gallery[], brand, sku, availability (bool), stock, category, variants{size,color,style,pattern}, characteristics{}, reviews{rating_average, review_count, list[]}`.
- Fetch order: `HTTPX` strategy tries httpx first unless the host is an AliExpress domain (`PW_DOMAINS`), falls back to Playwright when httpx fails, returns empty HTML, or returns data without a `title`. `PLAYWRIGHT` strategy goes straight to Chromium. Playwright waits for `domcontentloaded` then 2 s.
- Extraction order inside `extract_all_data`: canonical link → JSON-LD (extruct + raw `<script type=application/ld+json>`) → microdata/RDFa → OpenGraph/meta tags → Amazon parser (locks fields) → AliExpress parser (locks fields) → default heuristics for unlocked fields → nullable fields normalised to `null`.
- Price values are strings produced by `parse_price` (e.g. `"197.40"`); discount is computed as `-NN%` only when an old price is found.
- No explicit captcha detection exists: a blocked Amazon page yields `title` from `<title>` and mostly null fields (see fixture `robot_check.html`).
- Side effect: importing `engine.py` creates a `screenshots/` directory in the working directory (used only in debug mode).

## Live runs (2026-11-08, original code, before any change)

```
GET /health -> {"status":"ok"}
POST /api/scrape {"url":"https://www.amazon.fr/dp/B0CZ762XQ3","strategy":"HTTPX"}
  -> success=true, strategy_used=HTTPX, title="AOC Gaming Moniteur Incurvé, C27G4ZXED 27 Pouce 280Hz ...", price="197.40", currency="EUR", category="Informatique"
POST /api/scrape {"url":"https://maxesport.gg/fr/p/lethal-gaming-gear-saturn-xl-noir/","strategy":"HTTPX"}
  -> httpx got 429 -> fallback -> success=true, strategy_used=PLAYWRIGHT, title="Lethal Gaming Gear Saturn XL Noir", price="34.90"
extract_all_data(test.file.html) -> title="Smartphone Samsung Galaxy A56 5G ...", price="339.71", old_price="340.39", sku="1005012207835015", variants.color=["Graphite","Light Grey"]
```

## Known quirks kept on purpose (parity)

- `test.file.html` is an AliExpress page whose canonical URL differs from the product URL; the parser reports the canonical one.
- `discount` can be `"-0%"` when the old price is barely higher than the price.
- `reviews.rating_average` may be a float (AliExpress/Amazon parsers) or a string (JSON-LD / default parser).
