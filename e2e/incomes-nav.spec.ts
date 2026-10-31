import { test, expect } from "@playwright/test";

test.describe("Rentrées & navigation", () => {
  test("ajout rentrée depuis accueil", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "+ Rentrée" }).click();
    await page.getByRole("button", { name: "Rentrée", exact: true }).click();
    await page.getByPlaceholder("0,00").fill("42,00");
    await page.getByRole("button", { name: "Bourse", exact: true }).click();
    await page.locator("#qa-label").fill("Rentrée e2e");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 10_000 });

    await page.goto("/rentrees");
    await expect(page.getByText("Rentrée e2e").first()).toBeVisible();
  });

  test("option rentrée récurrente + mois dans le sheet", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "+ Rentrée" }).click();
    await page.getByRole("button", { name: "Rentrée", exact: true }).click();
    await expect(page.getByText(/Rentrée récurrente/i)).toBeVisible();
    await page.getByText(/Rentrée récurrente/i).click();
    await expect(page.getByText(/Mois de versement/i)).toBeVisible();
    await page.getByRole("button", { name: "Sep", exact: true }).click();
    await page.getByRole("button", { name: "Oct", exact: true }).click();
  });

  test("suppression rentrée", async ({ page }) => {
    await page.goto("/rentrees");
    const label = page.getByText("Rentrée e2e").first();
    if ((await label.count()) === 0) {
      test.skip(true, "Rentrée e2e absente");
    }
    await label.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Supprimer" }).click();
    await page.getByRole("button", { name: "Confirmer la suppression" }).click();
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 10_000 });
    await expect(page.getByText("Rentrée e2e")).toHaveCount(0, { timeout: 10_000 });
  });

  test("onglets navigation", async ({ page }) => {
    await page.goto("/");
    const tabs = [
      { name: "Accueil", path: "/" },
      { name: "Dépenses", path: "/depenses" },
      { name: "Coup de cœur", path: "/coups-de-coeur" },
      { name: "Dettes & épargne", path: "/dettes-epargne" },
      { name: "Plus", path: "/plus" },
    ];
    for (const t of tabs) {
      await page.getByRole("navigation").getByRole("link", { name: t.name }).click();
      await expect(page).toHaveURL(t.path === "/" ? "/" : t.path);
    }
  });

  test("pages Plus + rechargement", async ({ page }) => {
    const routes = [
      "/plus",
      "/enveloppes",
      "/abonnements",
      "/bilan",
      "/astuces",
      "/reglages",
      "/rentrees",
    ];
    for (const route of routes) {
      await page.goto(route);
      await expect(page).toHaveURL(route);
      await page.reload();
      await expect(page).toHaveURL(route);
      await expect(page.locator("body")).not.toContainText("Application error");
    }
  });

  test("retour arrière BackHeader", async ({ page }) => {
    await page.goto("/enveloppes");
    await page.getByRole("link", { name: "Retour" }).click();
    await expect(page).toHaveURL("/plus");
  });
});
