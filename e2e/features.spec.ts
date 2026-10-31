import { test, expect } from "@playwright/test";

test.describe("Fonctionnalités", () => {
  test("enveloppes : création", async ({ page }) => {
    await page.goto("/enveloppes");
    await page.getByRole("button", { name: "+ Créer une enveloppe" }).click();
    await page.getByLabel("Nom").fill("E2E Test Env");
    await page.getByLabel("Montant prévu / mois").fill("25");
    await page.getByRole("button", { name: /Créer l’enveloppe|Enregistrer/i }).click();
    await expect(page.getByText("E2E Test Env").first()).toBeVisible({ timeout: 10_000 });
  });

  test("enveloppes : modification via sheet", async ({ page }) => {
    await page.goto("/enveloppes");
    const env = page.getByText("E2E Test Env").first();
    if ((await env.count()) === 0) {
      test.skip(true, "Enveloppe e2e absente");
    }
    await env.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Modifier l’enveloppe/i })).toBeVisible();
    await page.getByLabel("Montant prévu / mois").fill("30");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 10_000 });
  });

  test("abonnements : ajout + retirer du suivi", async ({ page }) => {
    await page.goto("/abonnements");
    await page.getByRole("button", { name: "+ Ajouter un abonnement" }).click();
    await page.getByLabel("Nom").fill("E2E Sub Unique");
    await page.getByLabel(/Prix|Montant/i).fill("3,99");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("E2E Sub Unique").first()).toBeVisible({ timeout: 10_000 });
    await page
      .getByText("E2E Sub Unique")
      .first()
      .locator("xpath=ancestor::div[contains(@class,'rounded')][1]")
      .getByRole("button", { name: "Retirer du suivi" })
      .click();
    await expect(page.getByText(/retiré/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test("dettes & épargne : nouvelle dette + objectif", async ({ page }) => {
    await page.goto("/dettes-epargne");
    await page.getByRole("button", { name: "+ Nouvelle dette" }).click();
    await page.getByLabel("À qui ?").fill("E2E Ami Unique");
    await page.getByLabel("Montant").fill("50");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("E2E Ami Unique").first()).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "+ Nouvel objectif" }).click();
    await page.getByLabel("Nom").fill("E2E Coussin Unique");
    await page.getByLabel("Cible").fill("100");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("E2E Coussin Unique").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("coup de cœur : ajout", async ({ page }) => {
    await page.goto("/coups-de-coeur");
    await page.getByRole("button", { name: "+ Ajouter un coup de cœur" }).click();
    await page.getByLabel("Nom").fill("E2E Wishlist Unique");
    await page.getByLabel("Prix").fill("19,90");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("E2E Wishlist Unique").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("défis : lancer un défi", async ({ page }) => {
    await page.goto("/astuces");
    const challenge = page
      .getByRole("button", { name: /1 semaine sans achat|0 commande|sortie gratuite|café/i })
      .first();
    await challenge.click();
    await expect(page.getByRole("button", { name: "Valider le jour" }).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("réglages : enregistrer prénom", async ({ page }) => {
    await page.goto("/reglages");
    await page.getByLabel("Prénom").fill("Léa E2E");
    await page.getByRole("button", { name: "Enregistrer" }).first().click();
    await expect(page.getByText(/Réglages enregistrés|enregistré/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("export CSV authentifié", async ({ page }) => {
    const res = await page.request.get("/api/export/csv");
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    expect(text).toContain("type,date,label,amount");
  });
});
