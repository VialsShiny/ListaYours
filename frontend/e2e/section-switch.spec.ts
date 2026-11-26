import { expect, test } from "@playwright/test";
import { mockApi, settle, signInAs } from "./fixtures";

for (const scheme of ["light", "dark"] as const) {
  for (const width of [390, 1280]) {
    test(`section switch stays in view at ${width}px in ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await mockApi(page, "owner");
      await signInAs(page, "owner");
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/tableau-de-bord");
      await settle(page);
      await page.locator("#cadeaux h2").first().scrollIntoViewIfNeeded();
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
      const nav = page.getByRole("navigation", { name: "Sections du tableau de bord" });
      await expect(nav).toBeInViewport({ ratio: 1 });
      const top = await nav.evaluate((el) => el.getBoundingClientRect().top);
      expect(top).toBeLessThan(60);
      await expect(page.locator("#cadeaux h2").first()).toBeInViewport();
    });
  }
}
