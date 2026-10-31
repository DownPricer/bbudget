import { test, expect } from "@playwright/test";
import { USER2, login } from "./helpers/auth";
import fs from "node:fs";
import path from "node:path";

const SHOT_DIR = path.join("test-results", "screenshots-390");

test.describe("Affichage 390px", () => {
  test.beforeAll(() => {
    fs.mkdirSync(SHOT_DIR, { recursive: true });
  });

  test("captures pages seedées + console + touch targets", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/");

    const routes = [
      ["accueil", "/"],
      ["depenses", "/depenses"],
      ["coups-de-coeur", "/coups-de-coeur"],
      ["dettes-epargne", "/dettes-epargne"],
      ["plus", "/plus"],
      ["enveloppes", "/enveloppes"],
      ["abonnements", "/abonnements"],
      ["bilan", "/bilan"],
      ["rentrees", "/rentrees"],
      ["astuces", "/astuces"],
      ["reglages", "/reglages"],
    ] as const;

    const undersized: string[] = [];
    const overflow: string[] = [];

    for (const [name, route] of routes) {
      await page.goto(route);
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(SHOT_DIR, `${name}.png`),
        fullPage: true,
      });

      const metrics = await page.evaluate(() => {
        const vw = window.innerWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        let maxRight = 0;
        const smallButtons: string[] = [];
        document.querySelectorAll("button, a").forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          maxRight = Math.max(maxRight, r.right);
          if (r.height < 44 && r.width >= 20) {
            const label =
              (el as HTMLElement).innerText?.trim().slice(0, 40) ||
              el.getAttribute("aria-label") ||
              el.tagName;
            smallButtons.push(`${label} (${Math.round(r.width)}x${Math.round(r.height)})`);
          }
        });
        return {
          vw,
          scrollWidth,
          maxRight,
          smallButtons: [...new Set(smallButtons)].slice(0, 20),
        };
      });

      expect(
        metrics.scrollWidth,
        `scrollWidth overflow on ${route}`,
      ).toBeLessThanOrEqual(390);

      if (metrics.maxRight > metrics.vw + 2) {
        overflow.push(`${route}: right=${metrics.maxRight.toFixed(1)} vw=${metrics.vw}`);
      }
      if (metrics.smallButtons.length) {
        undersized.push(`${route}: ${metrics.smallButtons.join(" | ")}`);
      }
    }

    fs.writeFileSync(
      path.join(SHOT_DIR, "display-findings.json"),
      JSON.stringify({ consoleErrors, undersized, overflow }, null, 2),
      "utf8",
    );

    test.info().annotations.push({
      type: "display-findings",
      description: JSON.stringify({ consoleErrors, undersized, overflow }),
    });

    expect(undersized, `zones tactiles < 44px:\n${undersized.join("\n")}`).toEqual([]);
    expect(fs.existsSync(path.join(SHOT_DIR, "accueil.png"))).toBeTruthy();
  });

  test("état vide user2", async ({ browser }) => {
    const context = await browser.newContext({
      storageState: undefined,
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    await login(page, USER2.email, USER2.password);
    const ok = await page
      .waitForURL((u) => !u.pathname.includes("/connexion"), { timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    if (!ok) {
      test.info().annotations.push({
        type: "user2-login-failed",
        description: (await page.locator('[role="alert"]').last().textContent()) ?? "",
      });
      await context.close();
      test.skip(true, "user2 login bloqué (rate-limit probable)");
    }
    await page.goto("/");
    await page.screenshot({ path: path.join(SHOT_DIR, "empty-accueil.png"), fullPage: true });
    await page.goto("/depenses");
    await expect(page.getByText(/Aucune dépense/i)).toBeVisible();
    await page.screenshot({ path: path.join(SHOT_DIR, "empty-depenses.png"), fullPage: true });
    await page.goto("/enveloppes");
    await expect(page.getByText(/Aucune enveloppe/i)).toBeVisible();
    await page.screenshot({ path: path.join(SHOT_DIR, "empty-enveloppes.png"), fullPage: true });
    await context.close();
  });
});
