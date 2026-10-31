import { test, expect } from "@playwright/test";
import { DEMO, login, resetRateLimit } from "./helpers/auth";

test.describe("Rate limit connexion", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ request }) => {
    await resetRateLimit(request);
  });

  test("10 connexions réussies d'affilée sans blocage", async ({ page }) => {
    test.setTimeout(180_000);
    for (let i = 0; i < 10; i++) {
      await login(page, DEMO.email, DEMO.password);
      await page.waitForURL((url) => !url.pathname.includes("/connexion"), {
        timeout: 15_000,
      });
      await expect(
        page.getByRole("navigation", { name: "Navigation principale" }),
      ).toBeVisible();
      await page.goto("/plus");
      await page.getByRole("button", { name: "Se déconnecter" }).click();
      await page.waitForURL(/\/connexion/, { timeout: 15_000 });
      await expect(page.getByTestId("login-form")).toBeVisible();
    }
  });

  test("5 échecs puis message de blocage", async ({ page }) => {
    const email = `block-${Date.now()}@bbudget.app`;
    for (let i = 0; i < 5; i++) {
      await login(page, email, "wrong-password");
      await expect(page.getByTestId("login-error")).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId("login-error")).toContainText(/incorrect/i);
    }
    await login(page, email, "wrong-password");
    await expect(page.getByTestId("login-error")).toContainText(
      /Trop de tentatives\. Réessaie dans \d+ minute/i,
    );
  });

  test("1 échec puis 1 succès remet le compteur à zéro", async ({ page }) => {
    test.setTimeout(120_000);
    // 4 échecs (pas encore bloqué)
    for (let i = 0; i < 4; i++) {
      await login(page, DEMO.email, "wrong-password");
      await expect(page.getByTestId("login-error")).toContainText(/incorrect/i);
    }
    // Succès → reset compteur
    await login(page, DEMO.email, DEMO.password);
    await page.waitForURL((url) => !url.pathname.includes("/connexion"), {
      timeout: 15_000,
    });
    await page.goto("/plus");
    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await page.waitForURL(/\/connexion/);
    await page.getByTestId("login-form").waitFor({ state: "visible" });

    // Encore 4 échecs après reset → toujours pas bloqué, un succès doit passer
    for (let i = 0; i < 4; i++) {
      await login(page, DEMO.email, "wrong-password");
      await expect(page.getByTestId("login-error")).toContainText(/incorrect/i);
    }
    await login(page, DEMO.email, DEMO.password);
    await page.waitForURL((url) => !url.pathname.includes("/connexion"), {
      timeout: 15_000,
    });
    await expect(
      page.getByRole("navigation", { name: "Navigation principale" }),
    ).toBeVisible();
  });
});

