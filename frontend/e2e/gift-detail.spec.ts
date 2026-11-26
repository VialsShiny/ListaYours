import { expect, test, type Page } from "@playwright/test";
import { mockApi, settle, signInAs, type Role } from "./fixtures";
import { auditLayout, type Failure } from "./layout-audit";

const WIDTHS = [320, 390, 768, 1280];
const OPTIONS = { minBody: 16, minSecondary: 12, minTarget: 44 };
const RESERVATION_WORDS = /r[ée]serv|\bpris\b|\boffres?\b/i;

const report = (failures: Failure[]) =>
  failures.map((f) => `${f.rule} — ${f.target} — ${f.detail}`).join("\n");

async function open(page: Page, role: Role, width: number, path: string, dark = false) {
  if (dark) await page.emulateMedia({ colorScheme: "dark" });
  await mockApi(page, role);
  await signInAs(page, role);
  await page.setViewportSize({ width, height: 900 });
  await page.goto(path);
  await settle(page);
}

for (const width of WIDTHS) {
  for (const dark of [false, true]) {
    test(`gift page at ${width}px${dark ? " in dark" : ""}`, async ({ page }) => {
      await open(page, "visitor", width, "/l/noel/c/4?vue=grille", dark);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Logitech StreamCam");
      await expect(page.locator(".navigator-counter")).toHaveText(/02\s*\/\s*08/);
      await page.screenshot({
        path: `e2e/screenshots/cadeau-${width}${dark ? "-sombre" : ""}.png`,
        fullPage: true,
      });
      const failures = await page.evaluate(auditLayout, OPTIONS);
      expect(report(failures), report(failures)).toBe("");
    });
  }
}

test("previous, next and arrow keys move between gifts and keep the view mode", async ({
  page,
}) => {
  await open(page, "visitor", 1280, "/l/noel/c/4?vue=grille");
  await page.getByRole("link", { name: "Cadeau suivant" }).click();
  await expect(page).toHaveURL(/\/l\/noel\/c\/7\?vue=grille$/);
  await expect(page.locator(".navigator-counter")).toHaveText(/03\s*\/\s*08/);
  await expect(page.locator("html")).toHaveAttribute("data-modality", "pointer");
  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL(/\/l\/noel\/c\/4\?vue=grille$/);
  await page.getByRole("link", { name: "Retour à la liste" }).click();
  await expect(page).toHaveURL(/\/l\/noel\?vue=grille$/);
});

test("the grid card and the carousel slide lead to the gift page", async ({ page }) => {
  await open(page, "visitor", 1280, "/l/noel?vue=grille");
  await page.getByRole("link", { name: "Machine à espresso De'Longhi Dedica" }).click();
  await expect(page).toHaveURL(/\/l\/noel\/c\/1\?vue=grille$/);
  await open(page, "visitor", 1280, "/l/noel?vue=naviguer");
  await page.locator(".navigator-slide[data-active='true'] a").click();
  await expect(page).toHaveURL(/\/l\/noel\/c\/1\?vue=naviguer$/);
});

test("the owner sees no reservation state on a reserved gift", async ({ page }) => {
  await open(page, "owner", 390, "/l/noel/c/3?vue=naviguer");
  expect(await page.locator(".gift-detail").innerText()).not.toMatch(RESERVATION_WORDS);
  await expect(page.locator("[data-muted]")).toHaveCount(0);
});

test("the anonymous visitor is sent to sign in", async ({ page }) => {
  await open(page, "anonymous", 390, "/l/noel/c/1?vue=naviguer");
  const reserve = page.locator(".gift-detail-actions").getByRole("link", { name: "Réserver" });
  await expect(reserve).toHaveAttribute("href", /\/connexion\?next=%2Fl%2Fnoel%2Fc%2F1/);
});
