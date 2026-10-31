import { test, expect } from "@playwright/test";

test.describe("Dépenses", () => {
  test("ajout rapide via + avec montant à virgule 12,50", async ({ page }) => {
    await page.goto("/");
    const heroValue = page.locator("main").locator("p").filter({ hasText: /€/ }).first();
    const remainingBefore = await heroValue.textContent();

    await page.getByRole("button", { name: "+ Dépense" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByPlaceholder("0,00").fill("12,50");
    await page.getByRole("button", { name: /Fringues|Cosméto|Sorties|Divers/ }).first().click();
    await page.locator("#qa-label").fill("Test e2e virgule");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 10_000 });

    await page.goto("/depenses");
    await expect(page.getByText("Test e2e virgule").first()).toBeVisible();
    await expect(page.getByText("12,50 €").first()).toBeVisible();

    await page.goto("/");
    const remainingAfter = await heroValue.textContent();
    expect(remainingAfter).not.toEqual(remainingBefore);
  });

  test("montant vide : bouton Enregistrer désactivé", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "+ Dépense" }).click();
    await expect(page.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
  });

  test("montant négatif filtré ; plafond 100 000 €", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "+ Dépense" }).click();
    await page.getByPlaceholder("0,00").fill("-5");
    const val = await page.getByPlaceholder("0,00").inputValue();
    expect(val.includes("-")).toBeFalsy();

    await page.getByPlaceholder("0,00").fill("999999999");
    await page.getByRole("button", { name: /Fringues|Cosméto|Sorties|Divers/ }).first().click();
    await page.locator("#qa-label").fill("Test e2e huge");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
      /100[\s\u00a0]?000/,
    );
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("modification d'une dépense via sheet", async ({ page }) => {
    await page.goto("/depenses");
    const label = page.getByText("Test e2e virgule").first();
    if ((await label.count()) === 0) {
      test.skip(true, "Dépense e2e absente (ajout précédent échoué)");
    }
    await label.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Modifier la dépense/i })).toBeVisible();
    await page.getByPlaceholder("0,00").fill("15,00");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 10_000 });
    await expect(page.getByText("15,00 €").first()).toBeVisible();
  });

  test("suppression d'une dépense", async ({ page }) => {
    await page.goto("/depenses");
    const label = page.getByText("Test e2e virgule").first();
    if ((await label.count()) === 0) {
      test.skip(true, "Dépense e2e absente (ajout précédent échoué)");
    }
    await label.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Supprimer" }).click();
    await page.getByRole("button", { name: "Confirmer la suppression" }).click();
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 10_000 });
    await expect(page.getByText("Test e2e virgule")).toHaveCount(0, { timeout: 10_000 });
  });
});
