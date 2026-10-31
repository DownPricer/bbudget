import { DebtsSavingsClient } from "@/components/debts/debts-savings-client";
import { PageTitle } from "@/components/ui/page-title";
import { sortSnowball } from "@/lib/budget/debts";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { toNumber } from "@/lib/utils";

export const metadata = { title: "Dettes & épargne" };

export default async function DettesEpargnePage() {
  const user = await requireUser();
  const [debtsRaw, goals] = await Promise.all([
    prisma.debt.findMany({ where: { userId: user.id } }),
    prisma.savingsGoal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const debts = sortSnowball(
    debtsRaw.map((d) => ({
      id: d.id,
      creditor: d.creditor,
      remainingAmount: toNumber(d.remainingAmount),
      initialAmount: toNumber(d.initialAmount),
      monthlyPayment: d.monthlyPayment ? toNumber(d.monthlyPayment) : null,
    })),
  );

  return (
    <div>
      <PageTitle title="Dettes & épargne" subtitle="Remboursements et objectifs" />
      <DebtsSavingsClient
        debts={debts}
        goals={goals.map((g) => ({
          id: g.id,
          name: g.name,
          emoji: g.emoji,
          targetAmount: toNumber(g.targetAmount),
          currentAmount: toNumber(g.currentAmount),
        }))}
      />
    </div>
  );
}
