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

## 10. Monochrome restyle from the design mockups — PRs #29–#33 (2026-11-09)
- Changed: `frontend/app/theme/*` rewritten (tokens, base, typography, navigation, buttons, surfaces, forms), `styles/{components,overlays,grid,list,pages}.css`, Syne/Inter/Unbounded via `next/font/google`, shell (pill header, full-screen mobile menu, footer, display titles with the accent period), the two list views (`GiftNavigator` + `CategoryAccordion` + mobile `CategorySheet`, `GiftGrid` replacing the carousel, `ViewSwitch` in the URL and localStorage), landing, auth, reservations (total, confirm dialog), dashboard (section switch, panels, rows, drawer / bottom sheet), 404, feedback components; `docs/FONTS.md`, decisions 16–19.
- Ran: lint, format, typecheck, vitest (42, including `owner-privacy.test.ts`), browser checks on the dev server against the local API at 390/768/1024/1280/1440 (landing, both list views as anonymous, visitor and owner, registration, reservation and cancellation, « Mes réservations », dashboard with drawer and sheet, 404), keyboard navigation of the Naviguer view, contrast script (20 pairs), one reviewer pass per stage PR.
- Passed: all; no horizontal scroll at any width; every text pair ≥ 4.84:1; owner view of both views contains no reservation text, attribute or control.
- Failed: stage 1 review found accent-on-tile hovers at 4.31:1 and a `.hero` class left behind → fixed; stage 3 review found duplicate accordion ids and an active « Réserver » link for anonymous visitors on reserved gifts → fixed; a local `next build` run while `next dev` was running corrupted `.next` (cleared).
- Remains: Against/QuickSans still absent (`docs/FONTS.md`); toggle-off and field-border non-text contrast below 3:1 by design (decision 18); the 409 conflict path was not exercised in the browser.

## 11. Motion layer — PRs #35–#39 (2026-11-10)
- Changed: `lib/motion.ts` and the `--move` / `--move-ui` tokens, `ModalityTracker`, the 23 catalogue animations (`docs/MOTION.md`): sliding segmented control, Embla carousel with scaled neighbours, Base UI accordion, View Transition on the view switch, cascade, hover lift, ghost-word parallax, scroll reveal, overlay timings, swap labels, error shake, count-up total, on-demand confetti, Sonner toasts, hold-to-delete, dnd-kit sorting; decisions 20–24.
- Ran: lint, format, typecheck, vitest (52, incl. motion, feedback and owner-privacy tests), `next build` before/after for bundle sizes, a chunk scan of the build manifest, browser checks on the dev server at 1280 and 390 (carousel buttons and keyboard, modality attribute, ghost parallax, accordion, view switch + localStorage, sheet open/close timings, login error shake, reservation toast + confetti chunk, cancel dialog toast, keyboard sorting with a test category, hold-to-delete by pointer release and by keyboard), one reviewer pass per stage PR.
- Passed: all; landing and public list ship no confetti, dnd-kit or Motion code; owner views contain no reservation animation, toast or confetti trigger.
- Failed: stage 2 review caught a vacuous privacy assertion and a section switch observing nothing; stage 4 review caught a swap label stuck mid-fade and a StrictMode-blocked count-up → all fixed before merge.
- Remains: scroll reveal, section-switch tracking and the count-up frames could not be observed in the hidden browser pane (IntersectionObserver and rAF pause there); pointer drag of the carousel and of the sortable rows was exercised through dnd-kit/Embla APIs and keyboard, not with a real mouse drag.

## 12. Personal voice and type checks — PRs #41–#43 (2026-11-10)
- Changed: `app/content/voice.ts` + `voice-dashboard.ts` (every personal line, owner's voice, « tu », one placeholder `[PRÉNOM]`), landing / header / menu / footer / 404 / auth / public list / réservations / dashboard / API errors rewritten from it; titles no longer hyphenate and are sized on their column (`cqw`, decision 28); 44 px targets for the wordmark, text links, section switch, toggles and the slug input; Playwright responsive and type audit (`frontend/e2e`, `npm run test:e2e`, decision 29); decisions 25–29.
- Ran: lint, format, typecheck, vitest (58, incl. `voice.test.ts` and the extended owner-privacy test), Playwright audit at 320 / 360 / 390 / 430 / 640 / 768 / 1024 / 1280 / 1440 on 9 screens plus 4 overlays and 12 larger-text runs, screenshots at 320 / 390 / 1280, one reviewer pass on the voice diff, `next build` for the bundle sizes and a pitch-wording grep over the built pages.
- Passed: all (vitest 58/58, Playwright 121/121 on the last run, lint, format, typecheck, build); built pages contain no pitch wording, no « vous », and the landing and list chunks ship no confetti, dnd-kit or Motion code.
- Failed before fixing: « Connexion. » and « réservations. » wider than the 320 px column, section titles « Paramètres » / « Informatique » at 32 px, wordmark and text links under 44 px, section switch at 40 px, toggle and slug inputs under 44 px, sticky bars and the settings panel overflowing at 320 px or 125 % text, the drawer footer at 320 px → all fixed (decision 28, PR #43).
- Remains: the audit is not wired into the GitHub workflow (CI files off-limits); the brand fonts are still the Syne fallback, so the clamp values must be re-measured when Against ships; screenshots were inspected for the landing, réservations, inscription and the list, not every one of the 27 files.

## 13. Header identity and account page — branch `ui/account` (2026-11-11)
- Changed: API `GET/PATCH /api/account`, `POST /api/account/password`, `GET/PUT/DELETE /api/account/avatar` (`routers/account.py`, `services/account_service.py`, `utils/images.py`, `schemas/account.py`), `users.avatar` + `users.avatar_updated_at` (migration `0002`, additive), `UserOut` gains `has_avatar` / `avatar_updated_at`, `pillow==12.3.0`; front end `IdentityMenu` (desktop), `MobileIdentity` (phone menu), `UserAvatar`, `/parametres/compte` (`AccountView`, `AccountPage`, `ProfileForm`, `AvatarForm` + `AvatarDropzone`, `PasswordForm`), `lib/api-account.ts`, `lib/identity.ts`, `lib/avatar-file.ts` (canvas square crop), `hooks/use-avatar-url.ts`, `voice.account` (`content/voice-account.ts`), `styles/identity.css`; decisions 30–36.
- Ran: API ruff, ruff format, mypy, pytest (114 = 98 existing + 16 account tests: anonymous rejection, own-account only, read-only role, e-mail rules, password change, rate limits, wrong / disguised / oversize / huge-pixel uploads, re-encoding to 256 px WebP, no hash or token in any body); front end lint, format, typecheck, vitest (65 = 58 + 7), Playwright audit (159 checks: 11 screens × 9 widths, 33 larger-text runs, 6 overlays, 18 header identity checks with a one-letter and a 35-character pseudo, with and without a photo); a real-stack run (`next dev` on 3100 against the new API on 8999 with a scratch SQLite file): pseudo and e-mail edit, 409 on the owner's e-mail with values kept, wrong current password, password change then login old 401 / new 200, GIF and HTML-as-PNG refused in the browser, upload, replace and remove of the photo reflected in the header, redirect of an anonymous visit to `/connexion?next=…`; screenshots at 320 / 390 / 768 / 1280; a skeptical self-review of the PR diff (decision 37) and `next build` (`/` 115 kB, `/l/[slug]` 181 kB, `/parametres/compte` 116 kB first load).
- Passed: all of the above on the last runs (API 114/114, vitest 65/65, Playwright 166/166 plus one cold-server timeout on `liste-grille` at 320 px that passes on rerun).
- Failed before fixing: the identity menu stayed open after the client-side navigation to the account page (now closes on route change); « réservations » at 28 px no longer fitted beside the arrow in the phone menu at 320 px (clamp lowered, decision 36); the audit flagged the long pseudo scrolling inside its text input (editable controls exempted, decision 36).
- Remains: tokens issued before a password change stay valid until they expire (no revocation list in the project, decision 33); the audit is still not in the GitHub workflow; the visual check of the hidden browser pane was replaced by headless screenshots.

## 14. Dark mode — branch `ui/dark-mode` (2026-11-11)
- Changed: `theme/tokens.css` (dark blocks, six new tokens), `lib/theme.ts` (settings, boot script, apply), `hooks/use-theme.ts`, `components/layout/ThemeSwitch.tsx`, `ThemeMenuGroup.tsx`, footer, phone menu identity block and desktop account menu, `layout.tsx` (`<head>` boot script, `themeColor` per scheme, `suppressHydrationWarning`), hard-coded colours in `buttons.css`, `forms.css`, `navigation.css`, `components.css`, `list.css` and `StatusMessage` replaced by tokens, confetti colours read from the tokens, `voice.theme`; decisions 38–40.
- Ran: lint, format, typecheck, vitest (69 = 65 + 4 on `parseTheme` / `resolveTheme` / the boot script), Playwright audit with a dark run for the 11 screens and 6 overlays at 320 / 390 / 1280, a headless check of the three settings (system light and dark, explicit choice, back to system, stored choice applied before `DOMContentLoaded`, invalid stored value ignored, `theme-color` meta updated, no console warning), contrast ratios computed from the token values (decision 39), `next build`, a self-review (decision 41).
- Passed: all of the above (vitest 69/69, Playwright 212/212 after one drawer click timeout passed on rerun, build sizes unchanged).
- Remains: the dark run of the audit checks geometry, not colours (the contrast table is computed, not screenshot-measured); the brand fonts are still the Syne fallback.

## 15. Continuous deployment and hardening — branch `ops/continuous-deploy` (2026-11-11)
- Changed: `.github/workflows/deploy-api.yml` (arm64 image to GHCR after a green CI on `main`), `deploy/oracle/pull-deploy.sh` + `listayours-deploy.{service,timer}` (pull-based update every 5 min), `docker-compose.prod.yml` (image from GHCR, `API_IMAGE` in `.env`), `Caddyfile` (`request_body max_size 3MB`), `api/app/main.py` (`docs_options`: no docs/OpenAPI in production), `api/Dockerfile` (`--no-proxy-headers`), `frontend/next.config.mjs` (CSP and security headers, no `X-Powered-By`), `shadcn` moved to devDependencies, `.github/workflows/ci.yml` (actions pinned by SHA, read-only token, advisory `audit` job), `.github/workflows/uptime.yml`, `.github/dependabot.yml`, `docs/DEPLOY.md` §1, §4.11, §9.1, §9.2; decisions 42–45.
- Ran: security audit of the stack (55 black-box checks against a production-mode API on a scratch SQLite file, independent code review, `npm audit`, `pip-audit`, GitHub settings); API ruff, ruff format, mypy, pytest (117 = 114 + 3 on `docs_options`); frontend lint, format, typecheck, vitest (69), `next build`, Playwright audit (211 passed, 2 cold-server timeouts passed on rerun), a headless pass over 7 production pages with the CSP active (0 violations, styles and 23 fonts loaded); `docker compose config` on the production file with a placeholder env; `caddy validate`; YAML parse of the workflows; `bash -n` on the deploy script.
- Passed: all of the above on the last runs.
- Failed before fixing: `**docs_options()` unpacking tripped mypy (replaced by explicit keyword arguments); a stale `next-server` on port 3105 answered the first CSP checks with an older build (killed by socket owner).
- Remains: the pipeline only becomes live once the workflows reach `main` (`workflow_run` triggers from the default branch) and the GHCR package is made public or the VM logs in to the registry; the `main` ruleset still has no required status checks; the audit job is advisory until Playwright, Starlette, Pillow and Next are upgraded; the redirect SSRF in the frozen scraper is documented, not fixed (decision 45); the `ubuntu-24.04-arm` runner label is taken from GitHub's announcement and not yet exercised by a run.

## 16. Cookie sessions, same-origin API proxy and scraper egress guard — branch `feat/secure-sessions` (2026-11-25)
- Changed: API dependencies raised (FastAPI 0.165, Starlette 1.10, Pydantic 2.14, Playwright 1.65, Pillow 13, lxml 6, SQLAlchemy 2.1, httpx 0.28; vitest 4 with Vite 8); `app/scraper/network.py` and `app/scraper/egress_proxy.py` (validated redirect hops, Chromium behind a loopback egress proxy, landing-URL check), `url_safety.resolve_public`; `app/utils/session.py`, `app/middleware.py` (proxy gate with `API_PROXY_SECRET` and `X-Client-Ip`, CSRF guard), login/register set the cookie, `POST /api/auth/logout`; frontend `middleware.ts` proxies `/api/*` to `API_INTERNAL_URL` with the secret and the client address and refuses bodies above 3 MB, token plumbing removed from every hook, component and API helper (`session: true` flag in `apiFetch`), `auth-storage.ts` keeps only the profile cache, CSP `connect-src 'self'`; Caddy refuses requests without the secret; `NEXT_PUBLIC_API_URL` removed from Dockerfile, compose, CI and docs; decisions 46–49.
- Ran: API ruff, ruff format, mypy, pytest (129 = 121 + 8 on cookies, CSRF, proxy gate and network guards); frontend lint, prettier, typecheck, vitest (69), Playwright audit (213/213); a probe of the scraper against a local redirect server with and without the egress proxy (0 hits on the internal server with it); a real-stack run (`next dev` on 3100 proxying to the API on 8999 with a proxy secret): 20 checks on registration through the proxy, httpOnly Lax cookie invisible to scripts, no token in storage, reload keeps the session, direct API call 403 while `/health` stays open, cross-site and bare mutations 403, same-origin mutation 200, 2 MB avatar upload and read-back through the proxy, 3 MB refused with 413, CSP `connect-src 'self'`, logout clears the cookie.
- Passed: all of the above on the last runs.
- Failed before fixing: FastAPI now includes routers lazily (structure test walks the effective routes); Vite 8 ignores `esbuild.jsx` (moved to `oxc`); Playwright does not route redirect hops (the egress proxy was added); an oversize upload answered 413 before the proxy had finished sending and surfaced as 500 (the proxy now refuses it from `Content-Length`).
- Remains: `caddy validate` could not run (Docker Desktop engine down at the time); the Vercel edge behaviour of the rewrite (headers, 2 MB bodies, `request.ip`) is verified only on `next dev` until the first deployment; Bearer tokens remain accepted for scripts and the login body still returns the token.

## 17. Production deployment — Neon, Northflank, Vercel (2026-11-25)
- Changed: `api/Dockerfile` (`libatomic1`, needed by Playwright 1.65's Node driver, found by the first CI image build on PR #47); PR #47 merged into `feat/wishlist-platform`, PR #48 merged into `main` (the deploy workflows are now live); `docs/DEPLOY.md` (real state, Northflank card requirement and free-project limits), `docs/DECISIONS.md` rows 50–52, `README.md`.
- Ran: Neon project `Listayours` (Frankfurt) created by the user; Oracle sign-up attempted three times (rejected after card validation); Northflank service `listayours-api` built from `main` (a7dc514) with the eight runtime variables, Alembic migrations 0001–0002 applied on Neon at start-up (container log); Vercel project `listayours` (root `frontend`, `API_INTERNAL_URL` and `API_PROXY_SECRET` for Production); the 20-check session flow of § 16 replayed against `https://listayours.vercel.app` with a throwaway visitor account; curl checks of headers, `/docs`, direct API access and a 4 MB upload.
- Passed: CI on PR #47 (after the Dockerfile fix), PR #48 and `main`; live flow 20/20 (`__Host-listayours_session` httpOnly Lax, cross-site mutations 403, same-origin 200, avatar 200 then WebP + nosniff, 3 MB 413, logout clears, `/api/auth/me` 401 after); site headers (CSP `connect-src 'self'`, HSTS, nosniff, DENY, Referrer-Policy, Permissions-Policy); direct API 403, `/health` 200, `/docs` 404 via the site.
- Failed before fixing: the API image build on CI (`libatomic.so.1` missing in `python:3.11-slim`); the Northflank environment page showed no variables for a while after the user saved them (stale page, the container had them at start-up).
- Remains: `CORS_ORIGINS` on Northflank is exactly `https://listayours.vercel.app` (update it if a custom domain is added); no Northflank health check configured (optional: HTTP `/health` on port 8000); the owner account and the seed (`make seed`, § 7 of the deploy guide) are still to be run by the user; the test visitor account `visitor-<random>@example.com` created by the live check can be ignored; the GitHub `deploy-api.yml` image on GHCR is unused by Northflank (kept for the Oracle path); Dependabot security updates and CodeQL default setup are still off (user action).

## 18. Hardening pass, Next 15, CSV import and developer guide — branch `chore/hardening-and-dev-docs` (2026-11-26)
- Changed: API (decisions 53–56: token revocation with migration 0003, owner e-mail lock, fail-closed production settings, CSRF/Bearer tightening, token hidden from browsers, split rate limits, avatar caps and thread pool, generic scrape errors, shared schema types, `current_password` for e-mail changes, `nosniff` and `no-store` headers), CSV import endpoint `POST /api/owner/gifts/import` (decision 59), frontend (decision 57 and the Next 15.5 / React 19 upgrade, decision 58), `docs/DEVELOPMENT.md` (new developer guide), GitHub settings (decision 60), seven Dependabot PRs merged (#49, #50, #52–#56).
- Ran: two read-only audits (API and frontend) with findings prioritised; API pytest, ruff, ruff format, mypy; frontend lint, prettier, typecheck, vitest, build and the Playwright audit (see the PR for the final counts).
- Passed: API 202/202 (129 before: 41 hardening tests + 32 import tests), ruff, mypy; frontend counts recorded in the PR description.
- Remains: the frontend CSV import button (API ready; see the design in the PR), the Dependabot PRs for Next 16, React/react-dom, TypeScript 7 and Node 26 left open on purpose, the owner seed, and a Northflank health check. Existing production sessions are signed out once by the token format change.

## 19. Framework majors kept on hold — branch `claude/deps-framework-a8fbb1` (2026-11-26)
- Changed: decision 61 (Next.js stays on 15.5 with React 19; Dependabot #61 closed, #60 and #58 already closed by Dependabot once `main` carried React 19.3.1). No code change.
- Ran: `gh pr view` on the three PRs, `npm view next` (dist-tags, release dates, Next 16 engines and peers), `npm audit --omit=dev` on the frontend, a read-through of the Next 16 migration surface (`proxy.ts`, Turbopack vs the `webpack` block, `next lint` removal and ESLint 9).
- Passed: audit 0 vulnerabilities; 15.5.29 is on the same security release as 16.4.5.
- Failed: nothing.
- Remains: one planned migration to Next 16 and ESLint 9 later (proxy rename, flat config, Turbopack); TypeScript 7 and Node 26 are handled in their own session.

## 20. Dependabot tooling PRs: minor/patch group, TypeScript 7, Node 26 — branch `claude/deps-tooling-e5d51e` (2026-11-26)
- Changed: frontend minor/patch group bumped by hand on top of `main` (decision 62), `frontend/Dockerfile` on `node:26-alpine` (decision 64), TypeScript kept on 5.9 with the reason recorded (decision 63); Dependabot #59 closed with that reason, #80 and #51 superseded by the PR.
- Ran: in `frontend/`, `npm run lint`, `prettier --check`, `tsc --noEmit`, `vitest run`, `next build`, `playwright test`, before and after each bump; the same list with TypeScript 7.0.2 installed; `docker build` could not run locally (no reachable daemon), the CI Docker job builds the image.
- Passed: after the group bump, lint, prettier, tsc, vitest 93/93, build, Playwright 212/213 then the one timed-out screen (`feuille-categories at 768px`) green on rerun; with TypeScript 7 only vitest passed (93/93).
- Failed: with TypeScript 7, `tsc --noEmit` (TS2882 on `./globals.css`), `next lint` and `next build` ("TypeScript 7.0.2 is not supported by this version of Next.js", then unresolved `@/` imports), peer ranges of `@typescript-eslint/*` 8.74.
- Remains: TypeScript 6 or 7 once Next 16.2.11+ and the ESLint stack accept it; CI `NODE_VERSION`, `@types/node` and the developer guide still say Node 20; Dependabot #75 (`js-yaml`) untouched.

## 21. Sticky section switch and readable toggle — branch `fix/dashboard-switch-toggle` (2026-11-26)
- Changed: the dashboard section switch moved out of the hero into a `.section-bar` that sticks to the top of the viewport (translucent `--material-bg` with blur, z-index 30, safe-area aware, section anchors use `scroll-mt-24`); the toggle track is now `--tile` with a 2px `--soft` ring and a `--soft` knob when off, `--ink` track with an `--on-ink` knob when on; `e2e/section-switch.spec.ts`.
- Ran: lint, prettier, typecheck, vitest (93), build, Playwright (211 passed on the first full run, 6 failures: 2 audit flakes and 4 new-spec timeouts under load; all 7 pass on rerun after the spec scrolls with `scrollIntoViewIfNeeded`); toggle contrast from the token values: off ring against card 6.39 (light) / 7.15 (dark), off knob against track 5.45 / 6.38, on track against card 19.44 / 15.55, on knob against track 18.62 / 16.73 (all at least 3:1).
- Remains: contrast is computed from tokens, not measured on screenshots; the header is not sticky, so the bar sits at `top: 0`.

## 22. Gift page on the public list — branch `claude/gift-detail-page-418597` (2026-11-26)
- Changed: route `frontend/app/l/[slug]/c/[giftId]/page.tsx` (server page awaiting `params`) rendering `components/wishlist/detail/` (`GiftDetailView` data layer, `GiftDetailStage` scene, `GiftDetailNav` sibling mini-nav, `GiftDetailBar` bottom row), helpers `lib/gift-detail.ts` (`locateGift`, `siblingWindow`, `detailHref`, `listHref`), strings `content/voice-detail.ts`, styles `styles/detail.css` (decisions 65–68); grid cards and the centred carousel slide link to the gift page through an optional `detailHref` prop, the purchase link staying its own control; `docs/MOTION.md` gains the gift page section.
- Ran: lint, prettier, typecheck, vitest (99, with `tests/gift-detail.test.ts` for the helpers and the owner-privacy guard of the stage), `next build`, the Playwright audit with `e2e/gift-detail.spec.ts` (gift page at 320/390/768/1280 px, light and dark, screenshots; previous/next/arrow keys and Back; card and slide links; owner and anonymous roles). Counts in the PR.
- Passed: see the PR description for the final counts.
- Failed before fixing: the arrow-key handler read a `position` captured by the effect and could miss a move right after a click (now read from a ref); the ghost headline clipped from the left (now centred with `max-content` and clipped by the section).
- Remains: the gift page shows the same photo as the list (no gallery, the API has one `image_url`); the page title is the list's slug (the gift name is only known client-side); the first load compiles the route on `next dev`, which made the first Playwright run time out once.
## 23. Scraper images and the owner's image picker — branch `claude/scraper-images-cea326` (2026-11-26)
- Changed: `app/scraper/parsers/amazon_images.py` (image block only, original resolution, 8 max), `parsers/amazon.py` (title, buy-box price and list price, currency, feature-bullet description, brand, availability), `parsers/default.py` (gallery zone after structured data, srcset largest candidate, query-string duplicates, structured stock data respected), `parser.py` (site parsers gated by domain), `utils/text.py` (hidden elements found once); corpus of 40 pages (12 amazon.com, 7 amazon.fr incl. the bot interstitial, 5 amazon.de, 9 shops: IKEA, LDLC, Nike, Apple, Thalia, Dyson, Lush, Philips, Bellroy, plus the 6 existing goldens) with hand-checked expectations; `scripts/scrape_report.py` and `docs/SCRAPER-REPORT.md`; frontend `ImageChoice.tsx` (radio-group thumbnails under the image URL field), `imageCandidates` in `gift-prefill.ts`, French labels; decisions 69–72.
- Ran: report before/after on the corpus (title 55 → 90 %, price 77.5 → 100 %, currency 75 → 100 %, description 35 → 95 %, gallery 30 → 85 %, availability 70 → 87.5 %, main image 100 → 100 %), parse time on one 2 MB Amazon page 4.2 s → 1.0 s (cProfile); API pytest 242, ruff, ruff format, mypy; frontend lint, prettier, typecheck, vitest 95, `next build`, Playwright 212 passed + 1 flaky dark-mode dialog screenshot (`responsive.spec.ts`) passed on rerun.
- Failed before fixing: Amazon.fr/.de answer HTTPX with a "Continuer les achats" interstitial from this network (kept as a fixture, pages fetched through the scraper's Playwright strategy instead); Nike srcset URLs contain commas (parsed with a regex on descriptors); the AliExpress parser's `h1` fallback was silently providing Amazon titles.
- Remains: no new fixture is asserted field by field beyond the main image (the report measures the rest); brand and availability still miss on JS-only shops (Dyson, Philips, Bellroy) and Nike's `ProductGroup` JSON-LD; `default.py`, `parser.py` and `aliexpress.py` still exceed 200 lines; the timing in the report runs under load and is indicative only.

## 24. CSV import in the dashboard — branch `claude/csv-import-ui-df6e11` (2026-11-26)
- Changed: `frontend/app/lib/api-owner.ts` (`importGifts`, a 422 with row errors resolves as a result), `app/lib/api.ts` (`ApiErrorBody` keeps the extra keys), `app/lib/types.ts` (`GiftImportResult`), `app/lib/csv-file.ts` (extension check, UTF-8 then windows-1252 decoding, BOM and 1,000,000-character limit), `app/components/dashboard/GiftImportDialog.tsx` and `GiftImportPreview.tsx` (pick, dry run, confirm through `store.run`, success toast), `GiftManager.tsx` (secondary button in the header, icon button in the mobile bar), `app/content/voice-dashboard.ts` (`gifts.import`), `public/modele-import.csv`, `playwright.config.ts` (`E2E_PORT`), `e2e/gift-import.spec.ts`, the import drawer in the responsive overlays, `README.md` (Import CSV), decision 73.
- Ran: frontend lint, prettier, typecheck, vitest (111 after merging `main`, 10 new on `csv-file` and `importGifts`), `next build`, Playwright (241 after merging `main`: 5 import cases and 7 drawer audits added).
- Passed: all of the above; Playwright 235/241 on the full run under load, the 6 timeouts (`liste-naviguer` 390, 1440 and 1280 px dark, `feuille-categories` 390 px, `tiroir-import` 390 px, gift-detail arrow keys) passed on rerun.
- Failed before fixing: the responsive audit at 320 px (two text buttons overflowed the sheet footer, labels shortened); a first Playwright run reused a sibling checkout's `next dev` on port 3100, hence the `E2E_PORT` variable; one `next build` failed with a webpack error right after the suite and passed on a clean rerun; CI's Node 20 decodes the `windows-1252` label as plain Latin-1 (the euro-sign test failed there only), so the decoder now remaps the 0x80–0x9F range itself.
- Remains: the Dependabot majors (Next 16, React, TypeScript 7, Node 26), the owner seed and a Northflank health check, as before.
