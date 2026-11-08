# ListaYours

![Python](https://img.shields.io/badge/Python-3.11-3776ab?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi)
![Next.js](https://img.shields.io/badge/Next.js-14.2-000000?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)
![CI](https://github.com/VialsShiny/ListaYours/actions/workflows/ci.yml/badge.svg)

ListaYours est une plateforme de liste de souhaits : un propriétaire publie sa liste à une URL
publique, les visiteurs s'inscrivent, réservent un cadeau et le propriétaire **ne sait jamais** ce qui
a été réservé. Le cœur du projet est un scraper e‑commerce (Amazon, AliExpress, boutiques génériques)
qui pré‑remplit la fiche d'un cadeau à partir de son URL.

## Structure

```
api/        FastAPI + Playwright (scraper, authentification, listes, réservations)
frontend/   Next.js 14 (App Router), Tailwind 4, design éditorial monochrome
docs/       AUDIT.md, DECISIONS.md, DEPLOY.md
```

## Démarrage rapide

### Docker (pile complète)

```bash
cp .env.example .env
make docker-up
```

Frontend : http://localhost:3000 — API : http://localhost:8000 (`/docs` pour l'OpenAPI).

### Développement local

Prérequis : Node 20+, Docker (pour Postgres), et soit `uv`, soit Python 3.11.

```bash
make install   # venv Python 3.11, dépendances, Chromium, hooks git
make dev       # Postgres (docker) + API en rechargement + Next.js dev
```

## Commandes Makefile

| Cible | Rôle |
|-------|------|
| `make install` | Installe l'API (venv 3.11 via `uv`), le frontend, Chromium et les hooks commitlint |
| `make dev` | Lance Postgres, l'API (`--reload`) et le frontend (`next dev`) |
| `make build` | Compile le frontend (`next build`) et byte‑compile l'API |
| `make lint` | `ruff check` + `ruff format --check`, `next lint` + `prettier --check` |
| `make format` | `ruff --fix` + `ruff format`, `prettier --write` |
| `make test` | `pytest` (API) + `vitest` (frontend) |
| `make typecheck` | `mypy` + `tsc --noEmit` |
| `make seed` | Charge la liste de souhaits du propriétaire avec le vrai scraper (`DATABASE_URL`, `OWNER_EMAIL`, `OWNER_PASSWORD`, `SEED_ASSETS_BASE_URL`) |
| `make docker-build` / `docker-up` / `docker-down` | Images et pile complète Docker Compose |
| `make clean` | Supprime caches et artefacts de build |

## API de scraping

**POST** `/api/scrape`

```json
{ "url": "https://www.amazon.fr/dp/B0CZ762XQ3", "strategy": "HTTPX", "debug": false }
```

Réponse : `{ "success", "data": ProductData, "error", "strategy_used", "debug" }`. Le schéma de
`ProductData` (titre, prix en chaîne, images, variantes, caractéristiques, avis…) est figé par les
tests de parité dans `api/tests/scraper`. Pipeline : HTTPX → (repli) Playwright ; extraction
JSON‑LD → microdata → OpenGraph → parseurs Amazon / AliExpress → heuristiques génériques.

## Configuration

Toutes les variables sont listées dans [`.env.example`](.env.example) (noms uniquement, jamais de
secrets dans le dépôt). Les plus importantes : `DATABASE_URL`, `JWT_SECRET`, `OWNER_EMAIL`,
`CORS_ORIGINS`, `NEXT_PUBLIC_API_URL`.

## Qualité

- Conventional Commits imposés par commitlint (hook `commit-msg` via husky, et en CI).
- CI GitHub Actions : commitlint, lint, typecheck, tests (API avec Postgres), build, images Docker.
- Nouveaux fichiers sources < 200 lignes, pas de commentaires en ligne, logique métier dans `services/` (le scraper historique est figé par ses tests de parité, voir `docs/DECISIONS.md`).

## Documentation

- [`docs/AUDIT.md`](docs/AUDIT.md) — état réel de la pile et comportement du scraper (étape 1).
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — journal des décisions.
- [`docs/PRIVACY.md`](docs/PRIVACY.md) — comment l'API et la base garantissent que le propriétaire ne voit jamais les réservations.
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — mise en production gratuite avec une API qui ne dort jamais (Oracle Always Free + Vercel + Neon), étapes `[MANUAL]` marquées ; [`docs/HOSTING-RESEARCH.md`](docs/HOSTING-RESEARCH.md) détaille la comparaison des offres gratuites (relevé du 2026-11-08).
- [`deploy/`](deploy/) — compose de production, Caddyfile, timer anti-inactivité, notes Northflank.
- [`docs/screenshot-capture.md`](docs/screenshot-capture.md) — capture d'écran de debug du scraper.

## Dépannage

- **Playwright manquant** : `api/.venv/bin/playwright install chromium`
- **Python 3.11 absent** : `make install` utilise `uv` pour le télécharger (`uv python install 3.11`).
- **Docker** : `docker compose down -v && make docker-up` repart d'une base vide.
