import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import {
  calculateSpendableDashboard,
  getBudgetPeriod,
  type BudgetSummary,
  type EnvelopeSnapshot,
} from "@/lib/budget";
import {
  listActiveInstallmentCharges,
  syncDueInstallmentExpenses,
} from "@/lib/budget/sync-installments";

export async function getUserBudgetSettings(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: {
      budgetMonthStartDay: true,
      pleasurePercent: true,
      savingsPercent: true,
      debtBonusPercent: true,
      firstName: true,
      openingBalance: true,
      openingBalanceAt: true,
    },
  });
  if (!user) {
    // Session JWT orpheline (mauvaise DB / user supprimé) → reconnexion
    redirect("/connexion");
  }
  return user;
}

/** Charges obligatoires du mois (abonnements actifs + mensualités dettes). */
export async function getMandatoryChargesForMonth(userId: string): Promise<number> {
  const [subs, debts] = await Promise.all([
    prisma.subscription.findMany({
      where: { userId, status: { in: ["ACTIF", "A_RESILIER"] } },
      select: { amount: true, frequency: true },
    }),
    prisma.debt.findMany({
      where: { userId, remainingAmount: { gt: 0 } },
      select: { monthlyPayment: true },
    }),
  ]);

  let total = 0;
  for (const s of subs) {
    const amount = toNumber(s.amount);
    if (s.frequency === "MENSUEL") total += amount;
    else if (s.frequency === "ANNUEL") total += amount / 12;
    else if (s.frequency === "HEBDO") total += (amount * 52) / 12;
  }
  for (const d of debts) {
    if (d.monthlyPayment) total += toNumber(d.monthlyPayment);
  }
  return Math.round(total * 100) / 100;
}

export async function getDashboardBudget(
  userId: string,
  referenceDate = new Date(),
): Promise<{
  summary: BudgetSummary;
  period: ReturnType<typeof getBudgetPeriod>;
  firstName: string;
  hasIncome: boolean;
}> {
  await syncDueInstallmentExpenses(userId, referenceDate);

  const settings = await getUserBudgetSettings(userId);
  const period = getBudgetPeriod(referenceDate, settings.budgetMonthStartDay);
  const openingAt = settings.openingBalanceAt;

  const [
    incomesPeriod,
    expensesPeriod,
    flowsSinceOpening,
    envelopes,
    subscriptions,
    debts,
    installmentPayments,
  ] = await Promise.all([
      prisma.income.findMany({
        where: {
          userId,
          date: { gte: period.start, lte: period.end },
        },
        select: { amount: true },
      }),
      prisma.expense.findMany({
        where: {
          userId,
          date: { gte: period.start, lte: period.end },
        },
        select: { amount: true, envelopeId: true },
      }),
      Promise.all([
        prisma.income.aggregate({
          where: { userId, date: { gte: openingAt } },
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          where: { userId, date: { gte: openingAt } },
          _sum: { amount: true },
        }),
      ]),
      prisma.envelope.findMany({
        where: { userId },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.subscription.findMany({
        where: { userId, status: { in: ["ACTIF", "A_RESILIER"] } },
        select: { amount: true, frequency: true, billingDay: true, status: true },
      }),
      prisma.debt.findMany({
        where: { userId, remainingAmount: { gt: 0 } },
        select: {
          id: true,
          monthlyPayment: true,
          remainingAmount: true,
          payments: {
            where: { date: { gte: period.start, lte: period.end } },
            select: { id: true },
            take: 1,
          },
        },
      }),
      listActiveInstallmentCharges(userId),
    ]);

  const [incomeSinceAgg, expenseSinceAgg] = flowsSinceOpening;

  const spentByEnvelope = new Map<string, number>();
  for (const e of expensesPeriod) {
    spentByEnvelope.set(
      e.envelopeId,
      (spentByEnvelope.get(e.envelopeId) ?? 0) + toNumber(e.amount),
    );
  }

  const envelopeSnapshots: EnvelopeSnapshot[] = envelopes.map((env) => ({
    id: env.id,
    name: env.name,
    emoji: env.emoji,
    color: env.color,
    type: env.type,
    monthlyAmount: toNumber(env.monthlyAmount),
    spent: spentByEnvelope.get(env.id) ?? 0,
  }));

  const incomesTotal = incomesPeriod.reduce((s, i) => s + toNumber(i.amount), 0);

  const summary = calculateSpendableDashboard({
    openingBalance: toNumber(settings.openingBalance),
    incomesSinceOpening: toNumber(incomeSinceAgg._sum.amount ?? 0),
    expensesSinceOpening: toNumber(expenseSinceAgg._sum.amount ?? 0),
    today: referenceDate,
    periodStart: period.start,
    periodEnd: period.end,
    subscriptions: subscriptions.map((s) => ({
      amount: toNumber(s.amount),
      frequency: s.frequency,
      billingDay: s.billingDay,
      status: s.status,
    })),
    debts: debts.map((d) => ({
      monthlyPayment: d.monthlyPayment ? toNumber(d.monthlyPayment) : 0,
      remainingAmount: toNumber(d.remainingAmount),
      paidInPeriod: d.payments.length > 0,
    })),
    installmentPayments,
    envelopes: envelopeSnapshots,
    incomesTotal,
    allocation: {
      pleasurePercent: settings.pleasurePercent,
      savingsPercent: settings.savingsPercent,
      debtBonusPercent: settings.debtBonusPercent,
    },
  });

  return {
    summary,
    period,
    firstName: settings.firstName,
    hasIncome: incomesTotal > 0,
  };
}
