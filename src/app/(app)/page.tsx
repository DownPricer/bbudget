import Link from "next/link";
import { AdjustBalanceButton } from "@/components/home/adjust-balance-button";
import { HomeActions } from "@/components/home/home-actions";
import { HeroDark } from "@/components/ui/hero-dark";
import { ListRow } from "@/components/ui/list-row";
import { PageTitle } from "@/components/ui/page-title";
import { ProgressTrack } from "@/components/ui/progress-track";
import { EmptyState } from "@/components/ui/empty-state";
import { getDashboardBudget } from "@/lib/budget/queries";
import { noIncomeMessage, tightMonthMessage } from "@/lib/budget";
import { requireUser } from "@/lib/session";
import { formatEuro, toNumber } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

function upcomingBillingDays(billingDay: number, withinDays = 14): Date | null {
  const today = new Date();
  for (let i = 0; i <= withinDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDate() === billingDay) return d;
  }
  return null;
}

export default async function AccueilPage() {
  const user = await requireUser();
  const { summary, period, firstName, hasIncome } = await getDashboardBudget(user.id);
  const pleasureEnvelopes = summary.envelopes.filter((e) => e.type === "PLAISIR");

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: user.id, status: { in: ["ACTIF", "A_RESILIER"] } },
    orderBy: { billingDay: "asc" },
  });

  const upcoming = subscriptions
    .map((s) => {
      const date = upcomingBillingDays(s.billingDay);
      return date ? { ...s, nextDate: date } : null;
    })
    .filter(Boolean)
    .slice(0, 3) as Array<(typeof subscriptions)[number] & { nextDate: Date }>;

  return (
    <div className="pb-2">
      <PageTitle eyebrow={`Bonjour ${firstName}`} title={period.label} />

      <HeroDark
        label="Sur ton compte"
        value={formatEuro(summary.currentBalance)}
        hint={undefined}
      >
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-[#e3d7e4]">Solde suivi (banque)</p>
          <AdjustBalanceButton currentBalance={summary.currentBalance} />
        </div>
      </HeroDark>

      <div className="mb-4">
        <p className="text-xs font-bold text-[#746979]">Tu peux dépenser</p>
        <p className="mt-1 text-[34px] font-extrabold tracking-[-1.3px] tabular-nums leading-none text-ink">
          {formatEuro(summary.remainingToSpend)}
        </p>
        <p className="mt-2 text-xs text-muted">{summary.spendableHint}</p>
      </div>

      {!hasIncome ? (
        <p className="mb-3 rounded-[17px] bg-[#f8eaf3] px-3.5 py-3.5 text-xs text-[#8e687e]">
          {noIncomeMessage()}
        </p>
      ) : null}

      {summary.isTightMonth ? (
        <p className="mb-3 rounded-[17px] bg-[#f8eaf3] px-3.5 py-3.5 text-xs text-[#8e687e]">
          {tightMonthMessage()}
        </p>
      ) : null}

      <HomeActions />

      {upcoming.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-3 text-base font-bold text-ink">À venir</h2>
          {upcoming.map((s) => (
            <ListRow
              key={s.id}
              icon="▣"
              title={s.name}
              subtitle={s.nextDate.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
              })}
              value={formatEuro(toNumber(s.amount))}
            />
          ))}
        </section>
      ) : null}

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">Enveloppes plaisir</h2>
          <Link
            href="/enveloppes"
            className="touch-target inline-flex min-h-11 items-center text-sm font-semibold text-pink"
          >
            Voir tout →
          </Link>
        </div>
        {pleasureEnvelopes.length === 0 ? (
          <EmptyState
            title="Aucune enveloppe"
            description="Crée des enveloppes pour suivre tes dépenses."
          />
        ) : (
          pleasureEnvelopes.slice(0, 2).map((env) => (
            <ListRow
              key={env.id}
              icon={env.emoji}
              title={env.name}
              subtitle={`${formatEuro(env.spent)} / ${formatEuro(env.monthlyAmount)}`}
              value={formatEuro(Math.max(0, env.remaining))}
              footer={
                <ProgressTrack
                  progress={env.progress}
                  color={env.isOver ? "var(--peach-gauge)" : env.color}
                />
              }
            />
          ))
        )}
      </section>
    </div>
  );
}
