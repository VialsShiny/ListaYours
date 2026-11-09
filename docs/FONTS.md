# Fonts

The theme (`frontend/app/theme/tokens.css`) names two brand typefaces that are **not** in the
repository:

| Role | Family | Expected file | Weights declared |
|---|---|---|---|
| Titles (`--font-display`) | Against | `frontend/public/fonts/Against.woff2` | 400–900 |
| Text (`--font-text`) | QuickSans | `frontend/public/fonts/QuickSans.woff2` | 300–800 |

Until those files exist, the site renders with three Google Fonts loaded through
`next/font/google` in `frontend/app/layout.tsx`:

| CSS variable | Fallback | Weights | Used for |
|---|---|---|---|
| `--font-syne` | Syne | 600, 800 | display titles, gift names, section titles |
| `--font-inter` | Inter | 400–700 (variable) | body text, buttons, fields |
| `--font-unbounded` | Unbounded | 800 | the `LISTAYOURS` wordmark |

`frontend/app/globals.css` redefines the three stacks so that the fallbacks resolve to them:

```css
--font-display: "Against", var(--font-syne), "Syne", var(--font-inter), system-ui, sans-serif;
--font-text: "QuickSans", var(--font-inter), "Inter", system-ui, ...;
--font-wordmark: var(--font-unbounded), "Unbounded", var(--font-syne), "Syne", sans-serif;
```

Syne is noticeably wider than most display faces, which is why the hero title size is
`clamp(2.5rem, 0.5rem + 9vw, 8.5rem)` (about 43px at 390px, 123px at 1280px): at the mockup's
54–72px a word like « réservations » no longer fits a phone screen. Once Against is in place
the clamp can be raised again (decision 17 in `docs/DECISIONS.md`).

## Adding the brand fonts

1. Obtain licensed `woff2` files for Against and QuickSans. Nothing in this repository downloads
   them from a third party, and the build never needs them.
2. Copy them to `frontend/public/fonts/Against.woff2` and `frontend/public/fonts/QuickSans.woff2`
   (the folder exists and is served statically by Next.js and by the Docker image).
3. Rebuild (`npm run build` or `make docker-build`). No code change is needed: the `@font-face`
   rules in `tokens.css` already point at `/fonts/Against.woff2` and `/fonts/QuickSans.woff2`
   with `font-display: swap`, so the brand fonts take over as soon as the files are present and
   the Google fallbacks remain while they load.
4. Check the hero titles at 390px and raise `--text-hero-title` in `tokens.css` if Against
   leaves room for it.

If a file is a static (non-variable) font, keep the same file name; the browser will synthesise
the missing weights, or narrow the `font-weight` range in `tokens.css` to the weights you ship.

## Google Fonts and the Docker build

`next/font/google` fetches Syne, Inter and Unbounded **at build time**. Builds therefore need
outbound network access (local `npm run build`, Vercel and GitHub Actions all have it). The
fetch is occasionally flaky: a local `next build` once failed with
`An error occurred in next/font` and succeeded on the next run. If a build environment has no
network, the safe alternative is to place the three `woff2` files under `frontend/public/fonts/`
and switch `layout.tsx` to `next/font/local`, as decision 13 did for the previous design.
