import { PrismaClient } from "@prisma/client";

const p = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://bbudget:bbudget@localhost:5432/bbudget_e2e?schema=public",
    },
  },
});

async function main() {
  const users = await p.user.findMany({
    select: { email: true, onboardingCompleted: true },
  });
  const expenses = await p.expense.count();
  const envelopes = await p.envelope.count();
  console.log(JSON.stringify({ users, expenses, envelopes }, null, 2));
  await p.$disconnect();
}

main();
