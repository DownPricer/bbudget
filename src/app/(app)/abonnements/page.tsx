import { InstallmentPlansSection } from "@/components/installments/installment-plans-section";
import { SubscriptionList } from "@/components/subscriptions/subscription-list";
import { BackHeader } from "@/components/ui/back-header";
import { getBudgetPeriod, summarizePlan } from "@/lib/budget";
import { syncDueInstallmentExpenses } from "@/lib/budget/sync-installments";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { toNumber } from "@/lib/utils";

export const metadata = { title: "Abonnements" };

export default async function AbonnementsPage() {
  const user = await requireUser();
  await syncDueInstallmentExpenses(user.id);

  const settings = await prisma.user.findFirst({
    where: { id: user.id },
    select: { budgetMonthStartDay: true },
  });
  const period = getBudgetPeriod(new Date(), settings?.budgetMonthStartDay ?? 1);

  const [subscriptions, envelopes, plans] = await Promise.all([
    prisma.subscription.findMany({
      where: { userId: user.id },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    }),
    prisma.envelope.findMany({
      where: { userId: user.id, type: "PLAISIR" },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, emoji: true },
    }),
    prisma.installmentPlan.findMany({
      where: { userId: user.id },
      include: { payments: { orderBy: { index: "asc" } } },
      orderBy: [{ status: "asc" }, { endDate: "asc" }],
    }),
  ]);

  const planCards = plans.map((p) => {
    const payments = p.payments.map((pay) => ({
      status: pay.status,
      amount: toNumber(pay.amount),
      dueDate: pay.dueDate,
    }));
    const summary = summarizePlan(payments);
    return {
      id: p.id,
      name: p.name,
      provider: p.provider,
      providerLabel: p.providerLabel,
      envelopeId: p.envelopeId,
      totalAmount: toNumber(p.totalAmount),
      installmentCount: p.installmentCount,
      firstAmount: toNumber(p.firstAmount),
      firstDueDate: p.firstDueDate.toISOString(),
      frequency: p.frequency,
      endDate: p.endDate.toISOString(),
      status: p.status,
      paidCount: summary.paidCount,
      remainingToPay: summary.remainingToPay,
      nextDueDate: summary.nextDue?.dueDate.toISOString() ?? null,
      paidIndexes: p.payments.filter((x) => x.status === "PAYEE").map((x) => x.index),
    };
  });

  const monthTotal = plans
    .flatMap((p) => p.payments)
    .filter((pay) => {
      const t = pay.dueDate.getTime();
      return (
        pay.status === "A_VENIR" &&
        t >= period.start.getTime() &&
        t <= period.end.getTime()
      );
    })
    .reduce((s, pay) => s + toNumber(pay.amount), 0);

  return (
    <div>
      <BackHeader href="/plus" eyebrow="Frais fixes & prélèvements" title="Abonnements" />
      <SubscriptionList
        subscriptions={subscriptions.map((s) => ({
          id: s.id,
          name: s.name,
          amount: toNumber(s.amount),
          frequency: s.frequency,
          billingDay: s.billingDay,
          category: s.category,
          status: s.status,
        }))}
      />
      <InstallmentPlansSection
        plans={planCards}
        envelopes={envelopes}
        monthTotal={Math.round(monthTotal * 100) / 100}
      />
    </div>
  );
}
