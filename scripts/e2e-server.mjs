import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");
const staticSrc = path.join(root, ".next", "static");
const staticDest = path.join(standalone, ".next", "static");
const publicSrc = path.join(root, "public");
const publicDest = path.join(standalone, "public");

if (!existsSync(path.join(standalone, "server.js"))) {
  console.error("Build standalone manquant. Lance `npx next build` d'abord.");
  process.exit(1);
}

mkdirSync(path.dirname(staticDest), { recursive: true });
cpSync(staticSrc, staticDest, { recursive: true });
if (existsSync(publicSrc)) {
  cpSync(publicSrc, publicDest, { recursive: true });
}

const env = {
  ...process.env,
  PORT: process.env.PORT ?? "3001",
  HOSTNAME: "127.0.0.1",
  DATABASE_URL:
    process.env.DATABASE_URL ??
    "postgresql://bbudget:bbudget@localhost:5432/bbudget_e2e?schema=public",
  AUTH_SECRET:
    process.env.AUTH_SECRET ?? "e2e-secret-bbudget-test-only-not-for-prod",
  AUTH_TRUST_HOST: "true",
  AUTH_URL: process.env.AUTH_URL ?? "http://127.0.0.1:3001",
  ALLOW_SEED: "true",
};

const child = spawn(process.execPath, ["server.js"], {
  cwd: standalone,
  env,
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 1));
