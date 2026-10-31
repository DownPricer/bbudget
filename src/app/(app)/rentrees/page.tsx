import { IncomeRow } from "@/components/budget/income-row";
import { AddIncomeButton } from "@/components/budget/add-income-button";
import { BackHeader } from "@/components/ui/back-header";
import { EmptyState } from "@/components/ui/empty-state";
import { HeroDark } from "@/components/ui/hero-dark";
import { getBudgetPeriod } from "@/lib/budget";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatEuro, toNumber } from "@/lib/utils";

export const metadata = { title: "Rentrées" };

export default async function RentreesPage() {
  const user = await requireUser();
  const settings = await prisma.user.findFirst({
    where: { id: user.id },
    select: { budgetMonthStartDay: true },
  });
  const period = getBudgetPeriod(new Date(), settings?.budgetMonthStartDay ?? 1);

  const incomes = await prisma.income.findMany({
    where: {
      userId: user.id,
      date: { gte: period.start, lte: period.end },
    },
    orderBy: { date: "desc" },
  });

  const total = incomes.reduce((s, i) => s + toNumber(i.amount), 0);

  const recurring = await prisma.income.findMany({
    where: { userId: user.id, recurring: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <BackHeader href="/plus" eyebrow={period.label} title="Rentrées" />

      <HeroDark
        label="Total du mois"
        value={formatEuro(total)}
        hint={`${incomes.length} rentrée${incomes.length > 1 ? "s" : ""}`}
      />

      {incomes.length === 0 ? (
        <EmptyState
          title="Aucune rentrée"
          description="Ajoute une rentrée pour démarrer le suivi."
        />
      ) : (
        <ul className="flex flex-col">
          {incomes.map((i) => (
            <li key={i.id}>
              <IncomeRow
                id={i.id}
                label={i.label}
                amount={toNumber(i.amount)}
                date={i.date.toISOString()}
                type={i.type}
                recurring={i.recurring}
                months={i.months}
              />
            </li>
          ))}
        </ul>
      )}

      <AddIncomeButton />

      {recurring.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-3 text-base font-bold text-ink">Rentrées récurrentes</h2>
          <ul className="flex flex-col">
            {recurring.map((r) => (
              <li key={r.id}>
                <IncomeRow
                  id={r.id}
                  label={r.label}
                  amount={toNumber(r.amount)}
                  date={r.date.toISOString()}
                  type={r.type}
                  recurring={r.recurring}
                  months={r.months}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
