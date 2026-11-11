import { expect, test, type Page } from "@playwright/test";
import { mockApi, settle, signInAs, type Identity, type Role } from "./fixtures";
import { auditLayout, type Failure } from "./layout-audit";

const WIDTHS = [320, 360, 390, 430, 640, 768, 1024, 1280, 1440];
const SHOTS = new Set([320, 390, 1280]);
const OPTIONS = { minBody: 16, minSecondary: 12, minTarget: 44 };

type Screen = { name: string; path: string; role: Role; identity?: Identity };

const LONG_NAME = "Jean-Baptiste-Alexandre-Montmorency";

const SCREENS: Screen[] = [
  { name: "accueil", path: "/", role: "anonymous" },
  { name: "connexion", path: "/connexion", role: "anonymous" },
  { name: "inscription", path: "/inscription", role: "anonymous" },
  { name: "reservations", path: "/mes-reservations", role: "visitor" },
  { name: "tableau-de-bord", path: "/tableau-de-bord", role: "owner" },
  { name: "liste-naviguer", path: "/l/noel?vue=naviguer", role: "visitor" },
  { name: "liste-grille", path: "/l/noel?vue=grille", role: "visitor" },
  { name: "liste-proprietaire", path: "/l/noel?vue=naviguer", role: "owner" },
  { name: "introuvable", path: "/page-inexistante", role: "anonymous" },
  { name: "compte", path: "/parametres/compte", role: "visitor" },
  {
    name: "compte-photo",
    path: "/parametres/compte",
    role: "owner",
    identity: { avatar: true, displayName: LONG_NAME },
  },
];

type Overlay = Screen & {
  open: (page: Page) => Promise<void>;
  maxWidth?: number;
  minWidth?: number;
  wait?: string;
};

const OVERLAYS: Overlay[] = [
  {
    name: "menu",
    path: "/",
    role: "anonymous",
    maxWidth: 767,
    open: (page) => page.getByRole("button", { name: "Ouvrir le menu" }).click(),
  },
  {
    name: "menu-connecte",
    path: "/",
    role: "visitor",
    identity: { avatar: true, displayName: LONG_NAME },
    maxWidth: 767,
    open: (page) => page.getByRole("button", { name: "Ouvrir le menu" }).click(),
  },
  {
    name: "menu-compte",
    path: "/",
    role: "owner",
    identity: { displayName: LONG_NAME },
    minWidth: 768,
    wait: '[role="menu"]',
    open: (page) => page.locator(".identity-trigger").click(),
  },
  {
    name: "feuille-categories",
    path: "/l/noel?vue=naviguer",
    role: "visitor",
    maxWidth: 1023,
    open: (page) => page.getByRole("button", { name: "Catégories" }).first().click(),
  },
  {
    name: "tiroir-cadeau",
    path: "/tableau-de-bord",
    role: "owner",
    open: (page) => page.getByRole("button", { name: "Ajouter un cadeau" }).first().click(),
  },
  {
    name: "dialogue-annulation",
    path: "/mes-reservations",
    role: "visitor",
    open: (page) => page.getByRole("button", { name: "Annuler" }).first().click(),
  },
];

const report = (failures: Failure[]) =>
  failures.map((f) => `${f.rule} — ${f.target} — ${f.detail}`).join("\n");

async function openScreen(
  page: Page,
  screen: Screen,
  width: number,
  fontSize?: string,
  dark = false,
) {
  if (dark) await page.emulateMedia({ colorScheme: "dark" });
  await mockApi(page, screen.role, screen.identity);
  await signInAs(page, screen.role, screen.identity);
  await page.setViewportSize({ width, height: 900 });
  await page.goto(screen.path);
  await settle(page);
  if (fontSize) {
    await page.evaluate(
      (size) =>
        new Promise<void>((resolve) => {
          document.documentElement.style.fontSize = size;
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
      fontSize,
    );
  }
}

for (const screen of SCREENS) {
  for (const width of WIDTHS) {
    test(`${screen.name} at ${width}px`, async ({ page }) => {
      await openScreen(page, screen, width);
      if (SHOTS.has(width)) {
        await page.screenshot({
          path: `e2e/screenshots/${screen.name}-${width}.png`,
          fullPage: true,
        });
      }
      const failures = await page.evaluate(auditLayout, OPTIONS);
      expect(report(failures), report(failures)).toBe("");
    });
  }
}

for (const screen of SCREENS) {
  for (const width of [320, 390, 1280]) {
    test(`${screen.name} at ${width}px with larger text`, async ({ page }) => {
      await openScreen(page, screen, width, "125%");
      const failures = await page.evaluate(auditLayout, OPTIONS);
      expect(report(failures), report(failures)).toBe("");
    });
  }
}

for (const overlay of OVERLAYS) {
  for (const width of [320, 390, 768, 1280]) {
    if (overlay.maxWidth && width > overlay.maxWidth) continue;
    if (overlay.minWidth && width < overlay.minWidth) continue;
    test(`${overlay.name} at ${width}px`, async ({ page }) => {
      await openScreen(page, overlay, width);
      await overlay.open(page);
      const popup = overlay.wait ?? '[role="dialog"], [role="alertdialog"]';
      await expect(page.locator(popup).first()).toBeVisible();
      if (SHOTS.has(width)) {
        await page.screenshot({ path: `e2e/screenshots/${overlay.name}-${width}.png` });
      }
      const failures = await page.evaluate(auditLayout, OPTIONS);
      expect(report(failures), report(failures)).toBe("");
    });
  }
}

for (const screen of SCREENS) {
  for (const width of [320, 390, 1280]) {
    test(`${screen.name} at ${width}px in dark`, async ({ page }) => {
      await openScreen(page, screen, width, undefined, true);
      await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
      await page.screenshot({
        path: `e2e/screenshots/${screen.name}-${width}-sombre.png`,
        fullPage: true,
      });
      const failures = await page.evaluate(auditLayout, OPTIONS);
      expect(report(failures), report(failures)).toBe("");
    });
  }
}

for (const overlay of OVERLAYS) {
  for (const width of [320, 390, 1280]) {
    if (overlay.maxWidth && width > overlay.maxWidth) continue;
    if (overlay.minWidth && width < overlay.minWidth) continue;
    test(`${overlay.name} at ${width}px in dark`, async ({ page }) => {
      await openScreen(page, overlay, width, undefined, true);
      await overlay.open(page);
      const popup = overlay.wait ?? '[role="dialog"], [role="alertdialog"]';
      await expect(page.locator(popup).first()).toBeVisible();
      await page.screenshot({ path: `e2e/screenshots/${overlay.name}-${width}-sombre.png` });
      const failures = await page.evaluate(auditLayout, OPTIONS);
      expect(report(failures), report(failures)).toBe("");
    });
  }
}
