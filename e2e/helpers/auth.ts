import type { Page, APIRequestContext } from "@playwright/test";

export const DEMO = {
  email: "demo@bbudget.app",
  password: "demo1234",
} as const;

export const USER2 = {
  email: "user2@bbudget.app",
  password: "user2pass123",
} as const;

export async function resetRateLimit(request: APIRequestContext) {
  await request.post("/api/test/reset-rate-limit");
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("/connexion");
  await page.waitForLoadState("domcontentloaded");
  // Session encore active → redirect / → déconnexion explicite
  if (!page.url().includes("/connexion")) {
    await page.goto("/plus");
    const logoutBtn = page.getByRole("button", { name: "Se déconnecter" });
    if (await logoutBtn.isVisible().catch(() => false)) {
      await logoutBtn.click();
      await page.waitForURL(/\/connexion/, { timeout: 15_000 });
    } else {
      await page.goto("/connexion");
    }
  }
  await page.getByTestId("login-form").waitFor({ state: "visible", timeout: 15_000 });
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

/** Login frais (sans storageState) — à utiliser sparingly (rate-limit). */
export async function loginAsDemo(page: Page) {
  await login(page, DEMO.email, DEMO.password);
  await page.waitForURL((url) => !url.pathname.includes("/connexion"), {
    timeout: 20_000,
  });
}

export async function logout(page: Page) {
  await page.goto("/plus");
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await page.waitForURL(/\/connexion/, { timeout: 15_000 });
  await page.getByTestId("login-form").waitFor({ state: "visible", timeout: 10_000 });
  await page.context().clearCookies();
}
