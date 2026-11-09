# Running notes per stage (2026-11-08)

Five lines per stage: what changed, what ran, what passed, what failed, what remains. PR links point to the
GitHub pull requests merged into `feat/wishlist-platform`.

## 1. Audit and parity — PR #19
- Changed: dev tooling (pytest, ruff, mypy scoped away from the frozen scraper), golden parity tests (test.file.html, a recorded real Amazon page, 4 synthetic fixtures), contract and fetch-order tests, `docs/AUDIT.md`, `docs/DECISIONS.md`.
- Ran: pytest (32), ruff, mypy, live scrapes of two seed URLs through the original API.
- Passed: all.
- Failed: nothing.
- Remains: nothing.

## 2. Foundation — PR #20
- Changed: `.env.example`, multi-stage Dockerfiles with health checks, compose with Postgres, Makefile, commitlint + husky, GitHub Actions CI, frontend eslint/prettier/vitest, README.
- Ran: make lint/typecheck/test/build, docker compose build + up (3 healthy containers), a Playwright scrape inside the API container, CI green.
- Passed: all.
- Failed: first API image build on unpinned Debian 13 (Playwright 1.41 font packages) → pinned bookworm.
- Remains: nothing.

## 3. Data and auth — PR #21
- Changed: settings, SQLAlchemy models, Alembic migration, bcrypt + JWT auth, owner/visitor guards, rate limiter.
- Ran: pytest (48), ruff, mypy, CI with Postgres.
- Passed: all after review fixes.
- Failed: a concatenated requirements line broke the first CI run; `.local` test e-mails rejected by email-validator.
- Remains: nothing.

## 4. Core — PR #22
- Changed: owner wishlist/categories/gifts endpoints, public page, visitor reservations with UNIQUE(gift_id), owner-only hardened scrape endpoint.
- Ran: pytest (76, incl. 8-thread race test), ruff, mypy, CI.
- Passed: all after review fixes (null updates, positions, timeout bound, SSRF tightening, per-owner scrape budget).
- Failed: nothing blocking.
- Remains: nothing.

## 5. Privacy — PR #23
- Changed: owner-blindness suite over every owner route and error body, structural guards, `docs/PRIVACY.md`.
- Ran: pytest (87), ruff, mypy, CI.
- Passed: all after review fixes (accent folding, writes/error bodies, computed fields, cascade row count).
- Failed: nothing.
- Remains: nothing.

## 6. UI — PR #26
- Changed: complete Next.js UI in the editorial monochrome design, self-hosted fonts.
- Ran: lint, format, typecheck, vitest (29), build, end-to-end in the browser on the compose stack at 1440 px and 375 px (registration, reservation, cancellation, owner dashboard, scraper prefill, owner blindness).
- Passed: all.
- Failed: CI Docker build once (next/font/google fetch) → fonts self-hosted.
- Remains: nothing.

## 7. Seed and delivery — PR #24 + local run
- Changed: seed data (23 gifts, 8 categories), idempotent seed runner and CLI, `make seed`, two PDF-extracted images.
- Ran: pytest (98), live seed against the compose Postgres with the real scraper (23/23 gifts), full stack verified in the browser.
- Passed: all.
- Failed: New Balance page blocked (HTTPX 403 then an error page) → PDF price and image; 5 amazon.com prices without currency → PDF prices.
- Remains: production seed is a `[MANUAL]` step once the API is hosted (`docs/DEPLOY.md` § 7).

## 8. Production plan — PR #25
- Changed: `docs/DEPLOY.md`, `docs/HOSTING-RESEARCH.md`, `deploy/oracle`, `deploy/keepalive`, `deploy/northflank`, `frontend/vercel.json`.
- Ran: compose config validation, shell syntax check, reviewer spot-check of 8 official pages.
- Passed: all; no factual contradiction found.
- Failed: nothing.
- Remains: every `[MANUAL]` step (accounts, card, DNS, secrets) belongs to the owner; nothing is deployed.

## 9. Restyle with the cherry/jet/water theme — PR #28 (2026-11-09)
- Changed: `frontend/app/theme/*.css` (copied verbatim), `globals.css` token mapping, Inter via `next/font/google`, every page and component restyled (pill nav, gradient hero, `.index-tag` sections, `.card` gifts, panels), `docs/FONTS.md`, decisions 14–15.
- Ran: lint, typecheck, vitest (29), `next build`, docker compose build of the frontend image, browser checks at 375/768/1440 in light and dark (landing, public list, registration, reservation, second visitor, "Mes réservations", owner dashboard and drawer), WCAG contrast script (34 pairs).
- Passed: all; lowest contrast 4.65:1 (hero eyebrow on the lightest gradient stop); no horizontal scroll at any width; owner view shows no reservation data.
- Failed: first pass had Tailwind's own `container` utility overriding the theme's `.container` (overflow at 375) and a two-line "LISTAYOURS" at 375 → `@utility container` override and a mobile `display-wide` size.
- Remains: the brand fonts Against and QuickSans are not in the repository (see `docs/FONTS.md`); the 409 conflict path was exercised through the API only.
