# ListaYours

![Python](https://img.shields.io/badge/Python-3.11+-3776ab?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)
![Next.js](https://img.shields.io/badge/Next.js-14.2+-000000?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178c6?style=flat-square&logo=typescript&logoColor=white)

E-commerce product scraper that extracts structured data (price, images, specs, etc.) from product pages. Uses multiple parsing strategies with automatic fallback.

## Quick Start

### Docker (easiest)

```bash
git clone https://github.com/yourusername/ListaYours.git
cd ListaYours
docker compose up --build
```

Open http://localhost:3000 (frontend) and http://localhost:8000 (API)

### Local

**Backend:**
```bash
cd api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Structure

```
api/                    # FastAPI backend
├── app/main.py         # Entry point
├── models.py           # Pydantic schemas
└── scraper/
    ├── engine.py       # Orchestration
    ├── parser.py       # Data extraction
    └── parsers/
        ├── amazon.py   # Amazon-specific
        └── default.py  # Generic parsing

frontend/               # Next.js frontend
├── src/app/
│   ├── layout.tsx
│   └── page.tsx
└── package.json
```

## How it Works

1. Frontend sends URL + strategy (HTTPX or Playwright)
2. Backend tries HTTPX first (fast), falls back to Playwright if needed
3. Extraction pipeline runs: JSON-LD → microdata → OpenGraph → heuristics
4. Returns structured JSON with product data

## API

**POST** `/api/scrape`

```typescript
{
  "url": "https://example.com/product",
  "strategy": "HTTPX" // or "PLAYWRIGHT"
  "debug": false
}
```

Returns:
```json
{
  "success": true,
  "strategy_used": "HTTPX",
  "data": {
    "title": "...",
    "price": 29.99,
    "currency": "USD",
    "images": ["..."],
    "description": "...",
    // ... more fields
  }
}
```

Docs at `/docs` and `/redoc`

## Config

**Frontend** needs `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000`)

```bash
cp .env.example .env
```

## Troubleshooting

- **Playwright missing**: `playwright install chromium`
- **venv issues**: `source .venv/bin/activate` (Linux/Mac) or `.venv\Scripts\activate` (Windows)
- **API 404**: Make sure backend running on 8000
- **Docker issues**: `docker compose down -v && docker compose up --build`