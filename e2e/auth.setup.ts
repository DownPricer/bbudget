import { test as setup, expect } from "@playwright/test";
import path from "node:path";
import { DEMO } from "./helpers/auth";

const authFile = path.join(__dirname, ".auth", "demo.json");

setup("authenticate demo", async ({ page }) => {
  await page.goto("/connexion");
  await page.getByLabel("E-mail").fill(DEMO.email);
  await page.getByLabel("Mot de passe").fill(DEMO.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/connexion"), {
    timeout: 20_000,
  });
  await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeVisible();
  await page.context().storageState({ path: authFile });
});
