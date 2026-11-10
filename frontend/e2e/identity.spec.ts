import { expect, test, type Page } from "@playwright/test";
import { mockApi, settle, signInAs, type Identity, type Role } from "./fixtures";
import { auditLayout, type Failure } from "./layout-audit";

const WIDTHS = [320, 390, 768, 1280];
const OPTIONS = { minBody: 16, minSecondary: 12, minTarget: 44 };
const ROLE_LABELS = /Propriétaire|Invité\(e\)/;
const LONG = "Jean-Baptiste-Alexandre-Montmorency";

const CASES: { label: string; role: Exclude<Role, "anonymous">; identity: Identity }[] = [
  { label: "one letter, no photo", role: "visitor", identity: { displayName: "A" } },
  { label: "one letter, photo", role: "owner", identity: { displayName: "A", avatar: true } },
  { label: "long pseudo, no photo", role: "owner", identity: { displayName: LONG } },
  { label: "long pseudo, photo", role: "visitor", identity: { displayName: LONG, avatar: true } },
];

const report = (failures: Failure[]) =>
  failures.map((f) => `${f.rule} — ${f.target} — ${f.detail}`).join("\n");

async function open(page: Page, role: Role, width: number, identity: Identity = {}) {
  await mockApi(page, role, identity);
  await signInAs(page, role, identity);
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/");
  await settle(page);
}

for (const width of [390, 1280]) {
  test(`anonymous header shows nothing new at ${width}px`, async ({ page }) => {
    await open(page, "anonymous", width);
    const header = page.locator("header.nav");
    await expect(header.locator(".identity-trigger")).toHaveCount(0);
    await expect(header.locator(".avatar")).toHaveCount(0);
    expect(await header.innerText()).not.toMatch(ROLE_LABELS);
    if (width < 768) {
      await page.getByRole("button", { name: "Ouvrir le menu" }).click();
      const menu = page.getByRole("dialog");
      await expect(menu.locator(".identity-card")).toHaveCount(0);
      expect(await menu.innerText()).not.toMatch(ROLE_LABELS);
    }
  });
}

for (const item of CASES) {
  for (const width of WIDTHS) {
    test(`signed-in header, ${item.label}, at ${width}px`, async ({ page }) => {
      await open(page, item.role, width, item.identity);
      const name = item.identity.displayName ?? "";
      const label = item.role === "owner" ? "Propriétaire" : "Invité(e)";
      const header = page.locator("header.nav");
      const box = await header.boundingBox();
      expect(box, "header box").not.toBeNull();
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);

      if (width >= 768) {
        const trigger = header.locator(".identity-trigger");
        await expect(trigger).toBeVisible();
        await expect(trigger).toContainText(label);
        await expect(header.getByRole("button", { name: `${name} ${label}` })).toBeVisible();
        await expect(trigger.locator(".identity-name")).toHaveText(name);
        const triggerBox = await trigger.boundingBox();
        expect(triggerBox!.width).toBeLessThanOrEqual(240);
        expect(triggerBox!.height).toBeGreaterThanOrEqual(44);
        await expect(header.locator(".wordmark")).toBeVisible();
        if (item.identity.avatar) await expect(trigger.locator(".avatar img")).toBeVisible();
        else await expect(trigger.locator(".avatar")).toHaveText(name[0].toUpperCase());
        await trigger.click();
        const menu = page.getByRole("menu");
        await expect(menu).toBeVisible();
        await expect(menu.getByRole("menuitem", { name: "Mon compte" })).toBeVisible();
        await expect(menu.getByRole("menuitem", { name: "Sortir" })).toBeVisible();
      } else {
        await expect(header.locator(".identity-trigger")).toBeHidden();
        await page.getByRole("button", { name: "Ouvrir le menu" }).click();
        const card = page.getByRole("dialog").locator(".identity-card");
        await expect(card).toBeVisible();
        await expect(card).toContainText(label);
        await expect(card.locator(".identity-name")).toHaveText(name);
        await expect(page.getByRole("link", { name: "Mon compte" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Sortir" })).toBeVisible();
      }
      const failures = await page.evaluate(auditLayout, OPTIONS);
      expect(report(failures), report(failures)).toBe("");
    });
  }
}
