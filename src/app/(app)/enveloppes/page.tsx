import { CreateEnvelopeTrigger } from "@/components/budget/create-envelope-trigger";
import { EnvelopeCard } from "@/components/budget/envelope-card";
import { BackHeader } from "@/components/ui/back-header";
import { EmptyState } from "@/components/ui/empty-state";
import { HeroDark } from "@/components/ui/hero-dark";
import { getDashboardBudget } from "@/lib/budget/queries";
import { requireUser } from "@/lib/session";
import { formatEuro } from "@/lib/utils";

export const metadata = { title: "Enveloppes" };

export default async function EnveloppesPage() {
  const user = await requireUser();
  const { summary, period } = await getDashboardBudget(user.id);
  const pleasure = summary.envelopes.filter((e) => e.type === "PLAISIR");
  const available = pleasure.reduce((s, e) => s + Math.max(0, e.remaining), 0);

  return (
    <div>
      <BackHeader
        href="/plus"
        eyebrow={`Budgets plaisir · ${period.label}`}
        title="Enveloppes"
      />

      <HeroDark
        label="Disponible dans les enveloppes"
        value={formatEuro(available)}
        hint={`${pleasure.length} enveloppe${pleasure.length > 1 ? "s" : ""}`}
      />

      {pleasure.length === 0 ? (
        <EmptyState
          title="Aucune enveloppe"
          description="Crée une enveloppe pour suivre un budget plaisir."
        />
      ) : (
        <div className="mt-1">
          {pleasure.map((env) => (
            <EnvelopeCard key={env.id} envelope={env} />
          ))}
        </div>
      )}

      <CreateEnvelopeTrigger />
    </div>
  );
}
