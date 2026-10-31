import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env.e2e") });

const PORT = Number(process.env.PORT ?? 3001);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const authFile = path.join(__dirname, "e2e", ".auth", "demo.json");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 12_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  outputDir: "test-results",
  use: {
    baseURL: BASE_URL,
    browserName: "chromium",
    ...devices["Desktop Chrome"],
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "iphone-390",
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        storageState: authFile,
      },
    },
  ],
  webServer: {
    command: "node scripts/e2e-server.mjs",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      ...process.env,
      DATABASE_URL:
        "postgresql://bbudget:bbudget@localhost:5432/bbudget_e2e?schema=public",
      AUTH_SECRET: "e2e-secret-bbudget-test-only-not-for-prod",
      AUTH_TRUST_HOST: "true",
      AUTH_URL: BASE_URL,
      ALLOW_SEED: "true",
      SEED_EMAIL: "demo@bbudget.app",
      SEED_PASSWORD: "demo1234",
      PORT: "3001",
    },
  },
});
