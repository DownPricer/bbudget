/**
 * Prépare la base e2e : schema + seed démo + user2.
 * Usage : DATABASE_URL=... npx tsx scripts/e2e-prepare.ts
 */
import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

process.env.DATABASE_URL ??=
  "postgresql://bbudget:bbudget@localhost:5432/bbudget_e2e?schema=public";
process.env.ALLOW_SEED = "true";

async function main() {
  console.log("→ prisma db push");
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    stdio: "inherit",
    env: process.env,
  });

  console.log("→ seed");
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env: process.env });

  const prisma = new PrismaClient();
  const email2 = "user2@bbudget.app";
  const password2 = "user2pass123";
  const existing = await prisma.user.findUnique({ where: { email: email2 } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email: email2,
        passwordHash: await hash(password2, 12),
        firstName: "Alex",
        onboardingCompleted: true,
        pleasurePercent: 60,
        savingsPercent: 25,
        debtBonusPercent: 15,
      },
    });
    console.log("→ user2 créé");
  } else {
    await prisma.user.update({
      where: { email: email2 },
      data: { onboardingCompleted: true },
    });
    console.log("→ user2 déjà présent, onboarding OK");
  }
  await prisma.$disconnect();
  console.log("✅ e2e DB prête");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
