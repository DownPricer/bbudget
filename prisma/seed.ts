import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaClient, EnvelopeType, IncomeType, SubscriptionStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Le seed est interdit en production (NODE_ENV=production).");
    process.exit(1);
  }

  if (process.env.ALLOW_SEED === "false") {
    console.error("❌ Seed désactivé (ALLOW_SEED=false).");
    process.exit(1);
  }

  const email = process.env.SEED_EMAIL ?? "demo@bbudget.app";
  const password = process.env.SEED_PASSWORD ?? "demo1234";
  const firstName = process.env.SEED_FIRST_NAME ?? "Léa";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Utilisateur démo déjà présent : ${email}`);
    // Enrichir avec des dépenses du mois si absentes
    const expenseCount = await prisma.expense.count({ where: { userId: existing.id } });
    if (expenseCount === 0) {
      const envelopes = await prisma.envelope.findMany({
        where: { userId: existing.id },
        orderBy: { sortOrder: "asc" },
      });
      if (envelopes.length >= 2) {
        const now = new Date();
        await prisma.expense.createMany({
          data: [
            {
              userId: existing.id,
              envelopeId: envelopes[0].id,
              amount: 29.99,
              label: "Haut H&M",
              date: new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 3)),
            },
            {
              userId: existing.id,
              envelopeId: envelopes[1].id,
              amount: 12.5,
              label: "Masque cheveux",
              date: new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 1)),
            },
            {
              userId: existing.id,
              envelopeId: envelopes[2]?.id ?? envelopes[0].id,
              amount: 18,
              label: "Café + ciné",
              date: now,
            },
          ],
        });
        console.log("✅ Dépenses démo ajoutées");
      }
    }
    return;
  }

  const passwordHash = await hash(password, 12);
  const now = new Date();

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      onboardingCompleted: true,
      pleasurePercent: 60,
      savingsPercent: 25,
      debtBonusPercent: 15,
      openingBalance: 420,
      openingBalanceAt: new Date(now.getFullYear(), now.getMonth(), 1),
      envelopes: {
        create: [
          { name: "Fringues", emoji: "👗", color: "#F8C8DC", monthlyAmount: 80, type: EnvelopeType.PLAISIR, sortOrder: 0 },
          { name: "Cosméto", emoji: "💄", color: "#E8D5F2", monthlyAmount: 40, type: EnvelopeType.PLAISIR, sortOrder: 1 },
          { name: "Sorties", emoji: "🍹", color: "#B8E0D2", monthlyAmount: 60, type: EnvelopeType.PLAISIR, sortOrder: 2 },
          { name: "Divers", emoji: "🛍️", color: "#FFE5B4", monthlyAmount: 30, type: EnvelopeType.PLAISIR, sortOrder: 3 },
        ],
      },
      incomes: {
        create: [
          {
            amount: 550,
            label: "Bourse CROUS",
            type: IncomeType.BOURSE,
            date: new Date(now.getFullYear(), now.getMonth(), 5),
            recurring: true,
            months: [1, 2, 3, 4, 5, 6, 9, 10, 11, 12],
          },
        ],
      },
      subscriptions: {
        create: [
          { name: "Spotify", amount: 5.99, billingDay: 5, category: "Divertissement", status: SubscriptionStatus.ACTIF },
          { name: "Forfait téléphone", amount: 9.99, billingDay: 12, category: "Télécom", status: SubscriptionStatus.ACTIF },
        ],
      },
      debts: {
        create: [
          {
            creditor: "Parents",
            initialAmount: 200,
            remainingAmount: 120,
            monthlyPayment: 40,
            note: "Avance pour le voyage",
          },
        ],
      },
      savingsGoals: {
        create: [
          {
            name: "Coussin de sécurité",
            emoji: "🛟",
            targetAmount: 300,
            currentAmount: 45,
          },
        ],
      },
    },
    include: { envelopes: { orderBy: { sortOrder: "asc" } } },
  });

  await prisma.expense.createMany({
    data: [
      {
        userId: user.id,
        envelopeId: user.envelopes[0].id,
        amount: 29.99,
        label: "Haut H&M",
        date: new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 3)),
      },
      {
        userId: user.id,
        envelopeId: user.envelopes[1].id,
        amount: 12.5,
        label: "Masque cheveux",
        date: new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 1)),
      },
      {
        userId: user.id,
        envelopeId: user.envelopes[2].id,
        amount: 18,
        label: "Café + ciné",
        date: now,
      },
    ],
  });

  console.log(`✅ Seed OK — ${user.firstName} <${email}> / mot de passe : ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
