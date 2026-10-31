import { MonthDonut } from "@/components/bilan/month-donut";
import { BackHeader } from "@/components/ui/back-header";
import { Card, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { getMonthBilan } from "@/lib/budget/bilan";
import { requireUser } from "@/lib/session";
import { formatEuro } from "@/lib/utils";

export const metadata = { title: "Bilan du mois" };

export default async function BilanPage() {
  const user = await requireUser();
  const bilan = await getMonthBilan(user.id);

  return (
    <div>
      <BackHeader href="/plus" eyebrow={bilan.period.label} title="Bilan du mois" />

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <StatTile label="Rentrées" value={formatEuro(bilan.incomesTotal)} tone="mint" />
        <StatTile label="Dépenses" value={formatEuro(bilan.expensesTotal)} />
      </div>

      <Card className="mt-5">
        <CardTitle className="mb-2">Répartition par enveloppe</CardTitle>
        <MonthDonut data={bilan.donut} />
      </Card>

      <Card className="mt-2">
        <CardTitle className="mb-2">Par rapport au mois dernier</CardTitle>
        {bilan.comparisons.length > 0 ? (
          <ul className="space-y-1.5">
            {bilan.comparisons.map((c) => (
              <li key={c} className="text-[11px] text-muted">
                {c}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] text-muted">
            Pas encore assez d’historique pour comparer.
          </p>
        )}
      </Card>

      <StatTile
        className="mt-4"
        label="Total économisé ce mois-ci"
        value={formatEuro(bilan.totalSaved)}
      />
    </div>
  );
}
