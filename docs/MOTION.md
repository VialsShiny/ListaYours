# Motion

The motion layer implements the 23 animations of the design catalogue
(`listayours-design-refs/motion/ANIMATIONS.md`). Shared constants live in
`frontend/app/lib/motion.ts`; the CSS tokens (`--dur-*`, `--ease-*`) in `frontend/app/theme/tokens.css`.

## Common rules, where they are enforced

| Rule | Mechanism |
|---|---|
| Reduced motion keeps fades and colours, removes movement | `--move: 0` under `prefers-reduced-motion` (`tokens.css`); every transform transition is `calc(… * var(--move))`; JS hooks check `prefersReducedMotion()` |
| No animation on keyboard-initiated actions | `<html data-modality="keyboard">` set by `ModalityTracker` → `--move-ui: 0`; JS reads `getInputModality()` (carousel jumps, no View Transition, no confetti) |
| Hover only for mouse | `@media (hover: hover) and (pointer: fine)` |
| Only transform and opacity | plus `clip-path` (14, 18), `filter: blur` (13) and the Base UI accordion height (06) named by the catalogue |
| Exits faster than entrances | drawer/sheet 320 → 200 ms, dialog 180 → 120 ms, menu 180 → 120 ms |
| Privacy | the owner has no `ReservationControl`, so no reservation state, toast or confetti can reach them; `tests/owner-privacy.test.ts` |

## Catalogue

| N° | Animation | Component | Library | Files |
|---|---|---|---|---|
| 01 | Pression de bouton | every `.btn`, `.pressable`, nav links, chips, segments | CSS | `theme/buttons.css`, `theme/navigation.css` |
| 02 | Toggle à pastille | `Toggle` | CSS (native checkbox, `role="switch"`) | `theme/forms.css`, `ui/toggle.tsx` |
| 03 | Sélecteur à pastille glissante | `Segmented` → `ViewSwitch`, `SectionSwitch` | CSS | `ui/segmented.tsx`, `styles/motion.css` |
| 04 | Carrousel un cadeau à la fois | `NavigatorCarousel` | Embla Carousel 8.6.0 | `wishlist/NavigatorCarousel.tsx`, `hooks/use-gift-navigator.ts`, `styles/list.css` |
| 05 | Carte active agrandie | `NavigatorCarousel` slides | CSS | `styles/list.css` (`.navigator-slide`) |
| 06 | Accordéon des catégories | `CategoryAccordion` | Base UI Accordion + CSS | `wishlist/CategoryAccordion.tsx`, `styles/motion.css` |
| 07 | Feuille du bas | `Drawer placement="bottom"` → `CategorySheet`, `GiftFormDrawer` on phones | Base UI Drawer (Vaul not added, decision 21) | `ui/drawer.tsx`, `styles/overlays.css` |
| 08 | Tiroir latéral | `Drawer` → `GiftFormDrawer` | Base UI Drawer + CSS | `ui/drawer.tsx`, `styles/overlays.css` |
| 09 | Dialogue de confirmation | `ConfirmDialog` (cancel a reservation) | Base UI AlertDialog + CSS | `ui/confirm-dialog.tsx`, `styles/overlays.css` |
| 10 | Passage Naviguer / Grille | `useViewMode.switchTo` | View Transitions API | `hooks/use-view-mode.ts`, `styles/motion.css` |
| 11 | Entrée en cascade | `GiftGrid` cards, landing steps | CSS `@starting-style` | `styles/motion.css` (`.cascade`), `lib/motion.ts` (`cascadeStyle`) |
| 12 | Soulèvement au survol | `.card` | CSS | `styles/motion.css` |
| 13 | Bouton qui change d'état | `ReservationControl`, copy-link button | CSS + `useSwapLabel` | `ui/swap-label.tsx`, `hooks/use-swap-label.ts`, `styles/feedback.css` |
| 14 | Maintenir pour supprimer | `HoldButton` in `GiftRow`, `CategoryRow` | CSS clip-path | `ui/hold-button.tsx`, `styles/dashboard-motion.css` |
| 15 | Secousse d'erreur | `AuthForm` fields | CSS keyframes | `styles/feedback.css` (`.shake`) |
| 16 | Total qui s'incrémente | `ReservationsTotal` | JS rAF | `hooks/use-count-up.ts` |
| 17 | Mot géant qui suit la souris | `Hero`, `GiftNavigator` ghost word | JS (native lerp, Motion not added) | `hooks/use-ghost-parallax.ts` |
| 18 | Révélation au défilement | `HowItWorks` steps | CSS clip-path + IntersectionObserver | `hooks/use-reveal.ts`, `styles/motion.css` |
| 19 | Ressort interruptible | sortable rows settling | CSS `--ease-spring` transition (Motion not added, decision 23) | `styles/dashboard-motion.css` |
| 20 | Confettis de réservation | `WishlistView` `onReserved` | canvas-confetti 1.9.4, dynamic import | `lib/confetti.ts` |
| 21 | Messages de confirmation | `Toasts` + `lib/toast.ts`, `useActionToast` | Sonner 2.0.8 | `layout/Toasts.tsx`, `styles/feedback.css` |
| 22 | Tri par glisser | `SortableList` / `SortableRow` in both managers | dnd-kit core 6.3.1, sortable 10.0.0, utilities 3.2.2 (dynamic import on the dashboard) | `dashboard/SortableList.tsx`, `dashboard/SortableRow.tsx`, `lib/dnd-modifiers.ts` |
| 23 | Squelettes de chargement | `GiftCardSkeleton`, `WishlistHeaderSkeleton` | CSS | `styles/overlays.css` (`.skeleton`) |

## Bundle impact (`next build`, First Load JS)

| Route | Before | After | Delta | Libraries in the route's JS |
|---|---|---|---|---|
| `/` | 110 kB | 112 kB | +2 kB | none (Sonner is in the shared layout chunk) |
| `/l/[slug]` | 152 kB | 175 kB | +23 kB | Embla; confetti only after a reservation (separate chunk) |
| `/mes-reservations` | 134 kB | 143 kB | +9 kB | — |
| `/tableau-de-bord` | 156 kB | 181 kB | +25 kB | dnd-kit (route chunk only) |

A scan of the built chunks listed in `app-build-manifest.json` finds no `canvas-confetti`, `dnd-kit`
or Motion code in the `/` and `/l/[slug]` entries.

## Not added

Vaul (07) and Motion (17, 19): see decisions 21 and 23 in `docs/DECISIONS.md`.
