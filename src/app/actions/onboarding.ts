"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUserOrThrow } from "@/lib/session";
import { amountSchema, balanceAmountSchema } from "@/lib/validations/money";
import { z } from "zod";

const onboardingSchema = z.object({
  accountBalance: balanceAmountSchema,
  incomeAmount: amountSchema.optional(),
  incomeLabel: z.string().trim().max(80).optional(),
  subscriptions: z
    .array(
      z.object({
        name: z.string(),
        amount: amountSchema,
        category: z.string().optional(),
      }),
    )
    .default([]),
  debts: z
    .array(
      z.object({
        creditor: z.string().min(1),
        amount: amountSchema,
      }),
    )
    .default([]),
  envelopes: z
    .array(
      z.object({
        name: z.string(),
        emoji: z.string(),
        color: z.string(),
        monthlyAmount: amountSchema,
      }),
    )
    .min(1),
  savingsName: z.string().trim().optional(),
  savingsEmoji: z.string().optional(),
  savingsTarget: amountSchema.optional(),
});

export async function completeOnboarding(raw: unknown) {
  const user = await getUserOrThrow();
  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const data = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.envelope.deleteMany({ where: { userId: user.id } });

    await tx.envelope.createMany({
      data: data.envelopes.map((e, i) => ({
        userId: user.id,
        name: e.name,
        emoji: e.emoji,
        color: e.color,
        monthlyAmount: e.monthlyAmount,
        type: "PLAISIR" as const,
        sortOrder: i,
      })),
    });

    if (data.incomeAmount && data.incomeAmount > 0) {
      await tx.income.create({
        data: {
          userId: user.id,
          amount: data.incomeAmount,
          label: data.incomeLabel || "Bourse",
          type: "BOURSE",
          date: new Date(),
          recurring: true,
          months: [1, 2, 3, 4, 5, 6, 9, 10, 11, 12],
        },
      });
    }

    if (data.subscriptions.length > 0) {
      await tx.subscription.createMany({
        data: data.subscriptions.map((s) => ({
          userId: user.id,
          name: s.name,
          amount: s.amount,
          category: s.category ?? "Divers",
          status: "ACTIF" as const,
        })),
      });
    }

    if (data.debts.length > 0) {
      await tx.debt.createMany({
        data: data.debts.map((d) => ({
          userId: user.id,
          creditor: d.creditor,
          initialAmount: d.amount,
          remainingAmount: d.amount,
        })),
      });
    }

    if (data.savingsTarget && data.savingsTarget > 0) {
      await tx.savingsGoal.create({
        data: {
          userId: user.id,
          name: data.savingsName || "Coussin de sécurité",
          emoji: data.savingsEmoji || "🛟",
          targetAmount: data.savingsTarget,
        },
      });
    }

    await tx.user.update({
      where: { id: user.id },
      data: {
        onboardingCompleted: true,
        openingBalance: data.accountBalance,
        openingBalanceAt: new Date(),
      },
    });
  });

  revalidatePath("/");
  redirect("/");
}
