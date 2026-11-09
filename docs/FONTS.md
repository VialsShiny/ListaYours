# Fonts

The theme (`frontend/app/theme/tokens.css`) names two brand typefaces that are **not** in the
repository:

| Role | Family | Expected file | Weights declared |
|---|---|---|---|
| Titles (`--font-display`) | Against | `frontend/public/fonts/Against.woff2` | 400–900 |
| Text (`--font-text`) | QuickSans | `frontend/public/fonts/QuickSans.woff2` | 300–800 |

Until those files exist, every title and paragraph renders in **Inter**, loaded through
`next/font/google` in `frontend/app/layout.tsx` and exposed as the CSS variable `--font-inter`.
`frontend/app/globals.css` redefines the two stacks so that the fallback resolves to it:

```css
--font-display: "Against", var(--font-inter), "Inter", system-ui, sans-serif;
--font-text: "QuickSans", var(--font-inter), "Inter", system-ui, ...;
```

## Adding the brand fonts

1. Obtain licensed `woff2` files for Against and QuickSans. Nothing in this repository downloads
   them from a third party, and the build never needs them.
2. Copy them to `frontend/public/fonts/Against.woff2` and `frontend/public/fonts/QuickSans.woff2`
   (the folder exists and is served statically by Next.js and by the Docker image).
3. Rebuild (`npm run build` or `make docker-build`). No code change is needed: the `@font-face`
   rules in `tokens.css` already point at `/fonts/Against.woff2` and `/fonts/QuickSans.woff2`
   with `font-display: swap`, so the brand fonts take over as soon as the files are present and
   Inter remains the fallback while they load.

If a file is a static (non-variable) font, keep the same file name; the browser will synthesise
the missing weights, or narrow the `font-weight` range in `tokens.css` to the weights you ship.

## Inter and the Docker build

`next/font/google` fetches Inter from Google Fonts **at build time**. Builds therefore need
outbound network access (local `npm run build`, Vercel and GitHub Actions all have it). If a
build environment has no network, the safe alternative is to place an Inter `woff2` under
`frontend/public/fonts/` and switch `layout.tsx` to `next/font/local`, as decision 13 did for
the previous design.
