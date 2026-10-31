import { prisma } from "@/lib/prisma";
import { getBudgetPeriod } from "@/lib/budget/period";
import { toNumber } from "@/lib/utils";
import { yearlySubscriptionAmount } from "@/lib/budget/subscriptions";

export async function getMonthBilan(userId: string, reference = new Date()) {
  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: { budgetMonthStartDay: true },
  });
  const period = getBudgetPeriod(reference, user?.budgetMonthStartDay ?? 1);

  const prevRef = new Date(period.start);
  prevRef.setDate(prevRef.getDate() - 1);
  const prevPeriod = getBudgetPeriod(prevRef, user?.budgetMonthStartDay ?? 1);

  const [incomes, expenses, prevExpenses, wishes, cancelledSubs, deposits] =
    await Promise.all([
      prisma.income.findMany({
        where: { userId, date: { gte: period.start, lte: period.end } },
      }),
      prisma.expense.findMany({
        where: { userId, date: { gte: period.start, lte: period.end } },
        include: { envelope: true },
      }),
      prisma.expense.findMany({
        where: {
          userId,
          date: { gte: prevPeriod.start, lte: prevPeriod.end },
        },
        include: { envelope: true },
      }),
      prisma.wishItem.findMany({
        where: { userId, status: "ABANDONNE" },
        select: { price: true },
      }),
      prisma.subscription.findMany({
        where: { userId, status: "RESILIE" },
      }),
      prisma.savingsDeposit.findMany({
        where: {
          goal: { userId },
          date: { gte: period.start, lte: period.end },
        },
      }),
    ]);

  const incomesTotal = incomes.reduce((s, i) => s + toNumber(i.amount), 0);
  const expensesTotal = expenses.reduce((s, e) => s + toNumber(e.amount), 0);

  const byEnvelope = new Map<string, { name: string; color: string; value: number }>();
  for (const e of expenses) {
    const key = e.envelopeId;
    const cur = byEnvelope.get(key) ?? {
      name: e.envelope.name,
      color: e.envelope.color,
      value: 0,
    };
    cur.value += toNumber(e.amount);
    byEnvelope.set(key, cur);
  }

  const prevByName = new Map<string, number>();
  for (const e of prevExpenses) {
    prevByName.set(
      e.envelope.name,
      (prevByName.get(e.envelope.name) ?? 0) + toNumber(e.amount),
    );
  }

  const comparisons: string[] = [];
  for (const [, slice] of byEnvelope) {
    const prev = prevByName.get(slice.name) ?? 0;
    const diff = Math.round((prev - slice.value) * 100) / 100;
    if (diff > 0) {
      comparisons.push(
        `${formatDiff(diff)} de moins en ${slice.name.toLowerCase()} que le mois dernier`,
      );
    } else if (diff < 0 && Math.abs(diff) >= 5) {
      comparisons.push(
        `${formatDiff(Math.abs(diff))} de plus en ${slice.name.toLowerCase()}`,
      );
    }
  }

  const wishSaved = wishes.reduce((s, w) => s + toNumber(w.price), 0);
  const subSavedYearly = cancelledSubs.reduce(
    (s, sub) => s + yearlySubscriptionAmount(toNumber(sub.amount), sub.frequency),
    0,
  );
  const savingsThisMonth = deposits.reduce((s, d) => s + toNumber(d.amount), 0);

  return {
    period,
    incomesTotal,
    expensesTotal,
    donut: [...byEnvelope.values()],
    comparisons,
    totalSaved: Math.round((wishSaved + subSavedYearly / 12 + savingsThisMonth) * 100) / 100,
    wishSaved,
    subSavedYearly,
    savingsThisMonth,
  };
}

function formatDiff(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}
