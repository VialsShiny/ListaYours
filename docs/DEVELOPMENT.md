# Guide développeur

Ce guide s'adresse à quiconque modifie ListaYours. Il décrit l'installation, l'architecture, le modèle
de sécurité, les règles de code et le cycle de livraison. Les faits datés renvoient à
[`PROGRESS.md`](PROGRESS.md) (journal des étapes) et [`DECISIONS.md`](DECISIONS.md) (journal des
décisions, une ligne par choix avec sa raison). Le déploiement réel est décrit dans
[`DEPLOY.md`](DEPLOY.md) § 1.

## 1. Installation

Prérequis : Node 20, Python 3.11 (ou `uv`, qui l'installe), Docker pour Postgres.

```bash
cp .env.example .env     # valeurs locales, jamais commité
make install             # venv api/.venv, npm ci, Chromium, hooks git (commitlint)
make dev                 # Postgres (docker) + API en rechargement sur :8000 + Next.js sur :3000
```

Sans `make` : `cd api && .venv/bin/uvicorn app.main:app --reload` et `cd frontend && npm run dev`.
En local, `API_PROXY_SECRET` vide signifie que l'API accepte les appels directs (pratique pour
`/docs`) ; avec une valeur, seul le proxy Next.js passe.

## 2. Structure

```
api/app/
  main.py          création de l'app, middlewares (proxy_gate, csrf_guard, CORS, en-têtes), routeurs
  config.py        Settings lus dans l'environnement ; refuse de démarrer mal configuré en production
  middleware.py    proxy_gate (secret partagé + X-Client-Ip), csrf_guard (Sec-Fetch-Site / Origin)
  deps.py          dépendances FastAPI : session DB, utilisateur courant, rôles, limiteurs de débit
  routers/         une ressource par fichier (auth, account, owner, public, reservations, scrape)
  schemas/         modèles Pydantic d'entrée et de sortie (validation stricte, extra interdit)
  services/        logique métier, transactions, erreurs ServiceError -> HTTP
  db/              engine, Base, modèles SQLAlchemy, types ; migrations dans api/alembic/
  utils/           jwt/session cookie, images (avatars WebP), rate_limit, url_safety
  scraper/         parseurs HTML (Amazon, AliExpress, générique) verrouillés par un corpus de pages enregistrées
frontend/
  middleware.ts    proxy /api/* vers l'API (secret, adresse client, taille, en-têtes)
  next.config.mjs  CSP et en-têtes de sécurité
  app/lib/         appels API (api.ts), stockage local, helpers purs (safe-next, safe-url, prix)
  app/hooks/       état client (auth, données propriétaire, réservations, thème)
  app/components/  par domaine : auth, dashboard, wishlist, reservations, account, layout, ui
  app/content/     textes (voice-*.ts) : aucune chaîne utilisateur en dur dans les composants
  e2e/             audit responsive Playwright (API simulée), hors CI
```

## 3. Modèle de sécurité

- **Une seule origine côté navigateur.** Le navigateur ne parle qu'au site Next.js. `frontend/middleware.ts`
  réécrit `/api/*` vers `API_INTERNAL_URL` en ajoutant `X-Proxy-Secret` et `X-Client-Ip`, retire les
  en-têtes `X-Forwarded-*` et hop-by-hop fournis par le client, refuse les corps sans `Content-Length`
  (411), mal formés (400) ou de plus de 3 Mo (413), les méthodes inattendues (405), et répond 503 en
  production si la configuration manque. L'API (`proxy_gate`) refuse tout appel sans le secret, sauf
  `/health`.
- **Session.** Cookie `__Host-listayours_session` (httpOnly, Secure, SameSite=Lax) posé par
  `/api/auth/login` et `/api/auth/register`, effacé par `/api/auth/logout`. Le JWT porte `sub`, `iat`,
  `exp`, `iss` et une version de jeton : changer de mot de passe ou se déconnecter incrémente
  `users.token_version`, ce qui invalide tous les jetons antérieurs. Le jeton n'est renvoyé dans le
  corps qu'aux clients non navigateur (scripts) ; un navigateur ne reçoit que le cookie.
- **CSRF.** Les mutations authentifiées par cookie sont acceptées seulement avec un signal de même
  site (`Sec-Fetch-Site` ou `Origin` dans `CORS_ORIGINS`). L'en-tête `Authorization: Bearer` court-circuite
  la vérification car il ne peut pas être envoyé par un formulaire cross-site.
- **Rôles.** Un seul propriétaire : le compte dont l'e-mail vaut `OWNER_EMAIL`, qui ne peut pas changer
  cet e-mail. Les visiteurs réservent ; le propriétaire ne voit jamais l'état des réservations
  (voir [`PRIVACY.md`](PRIVACY.md) et les tests `api/tests/privacy`).
- **Limites de débit** (en mémoire, par processus) : connexion par adresse et par e-mail, inscription,
  mutations de compte, scraping par propriétaire, réservations par visiteur. `/api/auth/me` n'est pas
  limité.
- **Entrées.** Pydantic avec longueurs maximales, URL http(s) seulement, devise `[A-Z]{3}`, listes de
  réordonnancement bornées. Avatars : décodage Pillow borné (côté et pixels), bombe de décompression
  refusée, sortie WebP 256 px servie avec `nosniff`.
- **Scraper.** Chaque URL est résolue et vérifiée publique avant tout appel ; httpx suit les
  redirections à la main ; Chromium sort par un proxy local (`app/scraper/egress_proxy.py`) qui refuse
  les adresses privées. Le scraping est réservé au propriétaire.
- **Navigateur.** CSP (`connect-src 'self'`, `frame-ancestors 'none'`, `script-src-attr 'none'`,
  `upgrade-insecure-requests`), HSTS, `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`,
  `Permissions-Policy`, `Cross-Origin-Opener-Policy`. Les liens d'achat et images passent par
  `safeHttpUrl` (http/https uniquement) ; `?next=` après connexion passe par `safeNextPath` (chemin
  relatif sans caractère de contrôle).
- **Secrets.** Jamais dans le dépôt, les journaux, les arguments de build ou le chat : `.env` est
  ignoré par git, les secrets de production vivent chez Northflank et Vercel (marqués sensibles).
  Une valeur fuitée se remplace, elle ne se « nettoie » pas.

## 4. Règles de code

- Chaque fichier source fait moins de 200 lignes ; on découpe plutôt que d'allonger.
- Pas de commentaire `//`, `/* */` ni `#` en ligne : un bloc `/** */` ou une docstring explique le
  *pourquoi* quand il n'est pas évident ; le code dit le *comment*.
- Frontend : imports via `@/`, composants nommés dans leur dossier de domaine, textes dans
  `app/content`, aucune dépendance nouvelle sans décision notée. TypeScript strict, Prettier
  (`printWidth` 100), ESLint `next/core-web-vitals`.
- API : type hints partout, `ruff` (E, F, I, B, UP) et `mypy`, erreurs métier via `ServiceError`,
  messages utilisateur en français, aucune requête SQL brute.
- Toute garde de sécurité a un test qui échoue si on la retire.
- Le scraper (`api/app/scraper/**`) se modifie avec le corpus : `api/tests/scraper/fixtures/corpus.json` liste les
  pages enregistrées et leur `*.expected.json` relevé à la main ; toute attente modifiée s'explique dans la PR et
  `api/scripts/scrape_report.py --baseline` mesure l'avant/après (`docs/SCRAPER-REPORT.md`).

## 5. Vérifier son travail

```bash
make lint        # ruff + ruff format --check, next lint + prettier --check
make typecheck   # mypy + tsc --noEmit
make test        # pytest (API, SQLite) + vitest (frontend)
cd frontend && npm run build && npm run test:e2e   # build de production et audit Playwright
```

La CI (`.github/workflows/ci.yml`) rejoue lint, typecheck, tests, la construction des images Docker,
l'audit des dépendances (indicatif) et commitlint sur chaque PR. Les quatre premières sont
**obligatoires** pour fusionner dans `main` (règle de branche : PR requise, pas de force-push, pas de
suppression).

## 6. Livrer

1. Branche depuis `main` : `feat/...`, `fix/...`, `docs/...`, `chore/...`.
2. Commits Conventional Commits en anglais (`feat(api): ...`), en-tête ≤ 100 caractères ; le hook
   `commit-msg` et la CI les vérifient.
3. PR vers `main` ; fusion quand la CI est verte. La fusion dans `main` déploie : Vercel reconstruit
   le frontend, Northflank reconstruit l'image API depuis `api/Dockerfile`, les migrations Alembic
   s'exécutent au démarrage du conteneur.
4. Noter la décision dans `DECISIONS.md` et l'étape dans `PROGRESS.md` quand le changement n'est pas
   trivial.

Migrations : `cd api && .venv/bin/alembic revision -m "..."` puis compléter `upgrade`/`downgrade` ;
elles doivent fonctionner sur SQLite (tests) et Postgres (production), donc `server_default` pour
toute colonne `NOT NULL` ajoutée.

## 7. Dépendances et alertes

- Dependabot ouvre des PR hebdomadaires (npm racine et frontend, pip, actions, images Docker) et des
  PR de sécurité dès qu'une alerte apparaît ; CodeQL analyse chaque PR.
- Fusionner une PR Dependabot = CI verte + lecture des notes de version pour les sauts majeurs. Les
  sauts majeurs de framework (Next, React, TypeScript, Node) se traitent à part, avec la suite
  Playwright en plus de la CI.
- `npm audit --omit=dev` (frontend) et `pip-audit` (API) doivent rester sans vulnérabilité critique
  ou élevée ; les dépendances de développement s'évaluent au cas par cas.
