import { ExpenseRow } from "@/components/budget/expense-row";
import { AddExpenseButton } from "@/components/budget/add-expense-button";
import { EmptyState } from "@/components/ui/empty-state";
import { HeroDark } from "@/components/ui/hero-dark";
import { PageTitle } from "@/components/ui/page-title";
import { PillChips } from "@/components/ui/pill-chips";
import { getBudgetPeriod } from "@/lib/budget";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatEuro, toNumber } from "@/lib/utils";

export const metadata = { title: "Dépenses" };

type SearchParams = Promise<{ enveloppe?: string }>;

export default async function DepensesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const settings = await prisma.user.findFirst({
    where: { id: user.id },
    select: { budgetMonthStartDay: true },
  });
  const period = getBudgetPeriod(new Date(), settings?.budgetMonthStartDay ?? 1);

  const envelopes = await prisma.envelope.findMany({
    where: { userId: user.id },
    orderBy: { sortOrder: "asc" },
  });

  const envelopeFilter = params.enveloppe;

  const expenses = await prisma.expense.findMany({
    where: {
      userId: user.id,
      date: { gte: period.start, lte: period.end },
      ...(envelopeFilter ? { envelopeId: envelopeFilter } : {}),
    },
    include: { envelope: { select: { name: true, emoji: true } } },
    orderBy: { date: "desc" },
  });

  const total = expenses.reduce((s, e) => s + toNumber(e.amount), 0);

  return (
    <div>
      <PageTitle eyebrow={period.label} title="Dépenses" />
      <HeroDark
        label="Dépensé ce mois-ci"
        value={formatEuro(total)}
        hint={`${expenses.length} dépense${expenses.length > 1 ? "s" : ""} enregistrée${expenses.length > 1 ? "s" : ""}`}
      />

      <PillChips
        pills={[
          { label: "Toutes", href: "/depenses", active: !envelopeFilter },
          ...envelopes.map((env) => ({
            label: env.name,
            href: `/depenses?enveloppe=${env.id}`,
            active: envelopeFilter === env.id,
          })),
        ]}
      />

      {expenses.length === 0 ? (
        <EmptyState title="Aucune dépense" description="Ajoute une dépense pour commencer le suivi." />
      ) : (
        <ul className="flex flex-col">
          {expenses.map((e) => (
            <li key={e.id}>
              <ExpenseRow
                id={e.id}
                label={e.label}
                amount={toNumber(e.amount)}
                date={e.date.toISOString()}
                envelopeId={e.envelopeId}
                envelopeEmoji={e.envelope.emoji}
                envelopeName={e.envelope.name}
              />
            </li>
          ))}
        </ul>
      )}

      <AddExpenseButton />
    </div>
  );
}
