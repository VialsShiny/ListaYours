import { expect, test, type Page } from "@playwright/test";
import { mockApi, settle, signInAs } from "./fixtures";

const ROW_ERROR = { row: 2, field: "prix", message: "« abc » n'est pas un prix valide." };

const EMPTY = { dry_run: true, errors: [], categories_to_create: [], created_categories: 0 };

/**
 * Stands in for `POST /api/owner/gifts/import`: a row holding `abc` fails, the rest passes with
 * one category to create; the real import answers 201 with the counts.
 */
async function mockImport(page: Page) {
  await page.route("**/api/owner/gifts/import", async (route) => {
    const body = route.request().postDataJSON() as { content: string; dry_run: boolean };
    const broken = body.content.includes("abc");
    const result = broken
      ? { ...EMPTY, dry_run: body.dry_run, total_rows: 2, valid_rows: 1, errors: [ROW_ERROR] }
      : {
          ...EMPTY,
          dry_run: body.dry_run,
          total_rows: 2,
          valid_rows: 2,
          categories_to_create: ["Jardin"],
          created_gifts: body.dry_run ? 0 : 2,
          created_categories: body.dry_run ? 0 : 1,
        };
    const status = body.dry_run ? 200 : broken ? 422 : 201;
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(result) });
  });
}

function csvFile(rows: string) {
  const content = "﻿nom;prix;catégorie\r\n" + rows;
  return { name: "cadeaux.csv", mimeType: "text/csv", buffer: Buffer.from(content, "utf8") };
}

async function openImport(page: Page, width: number) {
  await mockApi(page, "owner");
  await mockImport(page);
  await signInAs(page, "owner");
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/tableau-de-bord");
  await settle(page);
  await page.getByRole("button", { name: "Importer un CSV" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: /Importer un CSV/ })).toBeVisible();
  return dialog;
}

test("the template is served as UTF-8 with a BOM and French headers", async ({ request }) => {
  const response = await request.get("/modele-import.csv");
  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text.startsWith("﻿nom;description;prix;")).toBe(true);
  expect(text.split(/\r?\n/).filter(Boolean)).toHaveLength(3);
  expect(text).not.toMatch(/https?:\/\/(?!example\.com)/);
});

for (const width of [390, 1280]) {
  test(`dry run with errors blocks the import at ${width}px`, async ({ page }) => {
    const dialog = await openImport(page, width);
    await expect(dialog.getByRole("link", { name: "Télécharger le modèle" })).toHaveAttribute(
      "href",
      "/modele-import.csv",
    );
    await page
      .locator('input[type="file"]')
      .setInputFiles(csvFile("Bonnet;12,50;\r\nCarnet;abc;\r\n"));
    await expect(dialog.getByText("1 cadeau à ajouter")).toBeVisible();
    const errors = dialog.getByTestId("import-errors");
    await expect(errors).toContainText("1 ligne à corriger");
    await expect(errors).toContainText("Ligne 2");
    await expect(errors).toContainText("prix");
    await expect(errors).toContainText(ROW_ERROR.message);
    await expect(dialog.getByRole("button", { name: "Importer", exact: true })).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Autre fichier" })).toBeEnabled();
  });
}

test("a clean file previews, imports on confirm and refetches the dashboard", async ({ page }) => {
  let refetches = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/owner/wishlist") refetches += 1;
  });
  const dialog = await openImport(page, 1280);
  await page
    .locator('input[type="file"]')
    .setInputFiles(csvFile("Bonnet;12,50;Jardin\r\nCarnet;9;\r\n"));
  await expect(dialog.getByText("2 cadeaux à ajouter")).toBeVisible();
  await expect(dialog.getByText("Catégories à créer")).toBeVisible();
  await expect(dialog.getByText("Jardin")).toBeVisible();
  await expect(dialog.getByTestId("import-errors")).toHaveCount(0);
  const before = refetches;
  await dialog.getByRole("button", { name: "Importer", exact: true }).click();
  await expect(page.getByText("2 cadeaux ajoutés.")).toBeVisible();
  await expect(dialog).toBeHidden();
  await expect.poll(() => refetches).toBeGreaterThan(before);
});

test("the mobile bar opens the import from its icon button", async ({ page }) => {
  await mockApi(page, "owner");
  await signInAs(page, "owner");
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/tableau-de-bord");
  await settle(page);
  const button = page.locator(".sticky-bar").getByRole("button", { name: "Importer un CSV" });
  await expect(button).toBeVisible();
  const box = await button.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
});
