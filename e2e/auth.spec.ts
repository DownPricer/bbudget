import { test, expect } from "@playwright/test";
import { DEMO, login, logout, resetRateLimit } from "./helpers/auth";

test.describe("Connexion (sans storageState)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ request }) => {
    await resetRateLimit(request);
  });

  test("bons identifiants → accueil", async ({ page }) => {
    await login(page, DEMO.email, DEMO.password);
    await page.waitForURL((url) => !url.pathname.includes("/connexion"), {
      timeout: 15_000,
    });
    await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeVisible();
  });

  test("mauvais mot de passe → message d'erreur", async ({ page }) => {
    await login(page, `bad-${Date.now()}@bbudget.app`, "wrong-password");
    await expect(page.getByTestId("login-error")).toContainText(/incorrect/i);
    await expect(page).toHaveURL(/\/connexion/);
  });

  test("page protégée sans session → redirection connexion", async ({ page }) => {
    await page.goto("/depenses");
    await expect(page).toHaveURL(/\/connexion/);
  });
});

test.describe("Déconnexion (avec session)", () => {
  test("déconnexion", async ({ page }) => {
    await page.goto("/");
    await logout(page);
    await expect(page).toHaveURL(/\/connexion/);
    await page.goto("/depenses");
    await expect(page).toHaveURL(/\/connexion/);
  });
});
