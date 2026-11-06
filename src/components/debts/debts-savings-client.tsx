"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListRow } from "@/components/ui/list-row";
import { ProgressTrack } from "@/components/ui/progress-track";
import { StatTile } from "@/components/ui/stat-tile";
import { addDebtPayment, createDebt, deleteDebt } from "@/app/actions/debts";
import { addSavingsDeposit, createSavingsGoal } from "@/app/actions/savings";
import { debtProgress } from "@/lib/budget/debts";
import { formatEuro } from "@/lib/utils";

type Debt = {
  id: string;
  creditor: string;
  remainingAmount: number;
  initialAmount: number;
  monthlyPayment: number | null;
};

type Goal = {
  id: string;
  name: string;
  emoji: string;
  targetAmount: number;
  currentAmount: number;
};

export function DebtsSavingsClient({
  debts,
  goals,
}: {
  debts: Debt[];
  goals: Goal[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sheet, setSheet] = useState<
    null | { type: "repay"; debtId: string } | { type: "deposit"; goalId: string } | "debt" | "goal"
  >(null);
  const [amount, setAmount] = useState("");
  const [creditor, setCreditor] = useState("");
  const [goalName, setGoalName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const totalDebt = debts.reduce((s, d) => s + d.remainingAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);

  function closeSheet() {
    setSheet(null);
    setAmount("");
    setCreditor("");
    setGoalName("");
    setDeleteConfirmId(null);
  }

  return (
    <div>
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <StatTile label="À rembourser" value={formatEuro(totalDebt)} tone="lav" />
        <StatTile label="Épargné" value={formatEuro(totalSaved)} tone="mint" />
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-base font-bold text-ink">Mes dettes</h2>
        {debts.length === 0 ? (
          <p className="rounded-[19px] border border-line bg-white p-[15px] text-[11px] text-muted">
            Aucune dette en cours.
          </p>
        ) : (
          debts.map((d) => {
            const paidRatio = debtProgress(d.initialAmount, d.remainingAmount);
            return (
              <ListRow
                key={d.id}
                icon="○"
                title={d.creditor}
                subtitle={
                  d.monthlyPayment
                    ? `${formatEuro(d.monthlyPayment)} / mois`
                    : "Sans mensualité définie"
                }
                value={formatEuro(d.remainingAmount)}
                footer={
                  <>
                    <ProgressTrack progress={paidRatio} color="var(--lav)" />
                    <div className="mt-3 flex flex-col gap-2">
                      <Button
                        type="button"
                        size="lg"
                        disabled={pending}
                        onClick={() => setSheet({ type: "repay", debtId: d.id })}
                      >
                        Rembourser
                      </Button>
                      {deleteConfirmId === d.id ? (
                        <div className="flex flex-col gap-2">
                          <p className="text-[11px] text-muted">
                            Supprimer cette dette et son historique de paiements ?
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={pending}
                            className="text-[#C9956C]"
                            onClick={() =>
                              startTransition(async () => {
                                setMsg(null);
                                const r = await deleteDebt(d.id);
                                if (!r.ok) {
                                  setMsg(r.error);
                                  return;
                                }
                                setDeleteConfirmId(null);
                                router.refresh();
                              })
                            }
                          >
                            Confirmer la suppression
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={pending}
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            Annuler
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => setDeleteConfirmId(d.id)}
                        >
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </>
                }
              />
            );
          })
        )}
        <Button
          type="button"
          variant="ghost"
          className="mt-2"
          onClick={() => setSheet("debt")}
        >
          + Nouvelle dette
        </Button>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-base font-bold text-ink">Épargne</h2>
        {goals.length === 0 ? (
          <p className="rounded-[19px] border border-line bg-white p-[15px] text-[11px] text-muted">
            Aucun objectif d’épargne.
          </p>
        ) : (
          goals.map((g) => {
            const pct =
              g.targetAmount > 0
                ? Math.min(1, g.currentAmount / g.targetAmount)
                : 0;
            const done = g.currentAmount >= g.targetAmount;
            return (
              <ListRow
                key={g.id}
                icon={g.emoji || "○"}
                title={g.name}
                subtitle={`Objectif ${formatEuro(g.targetAmount)}`}
                value={formatEuro(g.currentAmount)}
                footer={
                  <>
                    <ProgressTrack progress={pct} color="var(--mint)" />
                    {done ? (
                      <p className="mt-2 text-[11px] text-[#5a9e8a]">Objectif atteint</p>
                    ) : (
                      <Button
                        type="button"
                        size="lg"
                        className="mt-3"
                        disabled={pending}
                        onClick={() => setSheet({ type: "deposit", goalId: g.id })}
                      >
                        Verser
                      </Button>
                    )}
                  </>
                }
              />
            );
          })
        )}
        <Button
          type="button"
          variant="ghost"
          className="mt-2"
          onClick={() => setSheet("goal")}
        >
          + Nouvel objectif
        </Button>
      </section>

      {msg ? <p className="mt-3 text-sm text-rose-deep">{msg}</p> : null}

      <BottomSheet
        open={typeof sheet === "object" && sheet?.type === "repay"}
        onClose={closeSheet}
        title="Rembourser"
      >
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (typeof sheet !== "object" || sheet?.type !== "repay") return;
            const debtId = sheet.debtId;
            startTransition(async () => {
              const result = await addDebtPayment({ debtId, amount });
              if (result.ok) {
                if (result.cleared) setMsg("Dette réglée");
                closeSheet();
                router.refresh();
              }
            });
          }}
        >
          <Input
            label="Montant"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Button type="submit" size="lg" disabled={pending}>
            Enregistrer
          </Button>
        </form>
      </BottomSheet>

      <BottomSheet
        open={typeof sheet === "object" && sheet?.type === "deposit"}
        onClose={closeSheet}
        title="Verser"
      >
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (typeof sheet !== "object" || sheet?.type !== "deposit") return;
            const goalId = sheet.goalId;
            startTransition(async () => {
              const result = await addSavingsDeposit({ goalId, amount });
              if (result.ok) {
                if (result.completed) setMsg("Objectif atteint");
                closeSheet();
                router.refresh();
              }
            });
          }}
        >
          <Input
            label="Montant"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Button type="submit" size="lg" disabled={pending}>
            Enregistrer
          </Button>
        </form>
      </BottomSheet>

      <BottomSheet open={sheet === "debt"} onClose={closeSheet} title="Nouvelle dette">
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              await createDebt({ creditor, initialAmount: amount });
              closeSheet();
              router.refresh();
            });
          }}
        >
          <Input
            label="À qui ?"
            value={creditor}
            onChange={(e) => setCreditor(e.target.value)}
            required
          />
          <Input
            label="Montant"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Button type="submit" size="lg" disabled={pending}>
            Enregistrer
          </Button>
        </form>
      </BottomSheet>

      <BottomSheet open={sheet === "goal"} onClose={closeSheet} title="Nouvel objectif">
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              await createSavingsGoal({
                name: goalName,
                emoji: "○",
                targetAmount: amount,
              });
              closeSheet();
              router.refresh();
            });
          }}
        >
          <Input
            label="Nom"
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            required
          />
          <Input
            label="Cible"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Button type="submit" size="lg" disabled={pending}>
            Enregistrer
          </Button>
        </form>
      </BottomSheet>
    </div>
  );
}
