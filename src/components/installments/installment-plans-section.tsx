"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { ListRow } from "@/components/ui/list-row";
import { ProgressTrack } from "@/components/ui/progress-track";
import {
  InstallmentPlanForm,
  type InstallmentEnvelope,
} from "@/components/installments/installment-plan-form";
import { formatDateFr, formatEuro } from "@/lib/utils";
import type { InstallmentFrequency } from "@/lib/budget/installments";

export type PlanCard = {
  id: string;
  name: string;
  provider: string;
  providerLabel?: string | null;
  envelopeId: string;
  totalAmount: number;
  installmentCount: number;
  firstAmount: number;
  firstDueDate: string;
  frequency: InstallmentFrequency;
  endDate: string;
  status: string;
  paidCount: number;
  remainingToPay: number;
  nextDueDate?: string | null;
  paidIndexes: number[];
};

const PROVIDER_LABELS: Record<string, string> = {
  KLARNA: "Klarna",
  PAYPAL: "PayPal",
  ALMA: "Alma",
  AUTRE: "Autre",
};

export function InstallmentPlansSection({
  plans,
  envelopes,
  monthTotal,
}: {
  plans: PlanCard[];
  envelopes: InstallmentEnvelope[];
  monthTotal: number;
}) {
  const [openCreate, setOpenCreate] = useState(false);
  const [edit, setEdit] = useState<PlanCard | null>(null);

  const active = plans.filter((p) => p.status === "EN_COURS");
  const remainingAll = active.reduce((s, p) => s + p.remainingToPay, 0);

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-ink">Paiements en plusieurs fois</h2>
        <Button type="button" size="sm" onClick={() => setOpenCreate(true)}>
          + Plan
        </Button>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-[17px] border border-line bg-white p-3">
          <p className="text-[11px] text-muted">Reste à payer</p>
          <p className="mt-1 text-lg font-extrabold tabular-nums text-ink">
            {formatEuro(remainingAll)}
          </p>
        </div>
        <div className="rounded-[17px] border border-line bg-white p-3">
          <p className="text-[11px] text-muted">Échéances ce mois</p>
          <p className="mt-1 text-lg font-extrabold tabular-nums text-ink">
            {formatEuro(monthTotal)}
          </p>
        </div>
      </div>

      {plans.length === 0 ? (
        <p className="rounded-[19px] border border-line bg-white p-[15px] text-[11px] text-muted">
          Klarna, PayPal, Alma… suis tes paiements échelonnés ici.
        </p>
      ) : (
        plans.map((p) => {
          const progress = p.installmentCount > 0 ? p.paidCount / p.installmentCount : 0;
          const provider =
            p.provider === "AUTRE"
              ? p.providerLabel || "Autre"
              : PROVIDER_LABELS[p.provider] ?? p.provider;
          return (
            <button
              key={p.id}
              type="button"
              className="block w-full touch-target text-left"
              onClick={() => setEdit(p)}
            >
              <ListRow
                icon="▦"
                title={p.name}
                subtitle={`${provider} · ${p.paidCount}/${p.installmentCount} payées${
                  p.status !== "EN_COURS" ? ` · ${p.status === "ANNULE" ? "annulé" : "terminé"}` : ""
                }`}
                value={formatEuro(p.remainingToPay)}
                footer={
                  <>
                    <ProgressTrack progress={progress} color="var(--pink)" />
                    <p className="mt-2 text-[11px] text-muted">
                      {p.nextDueDate
                        ? `Prochaine : ${formatDateFr(p.nextDueDate)}`
                        : "Plus d’échéance"}
                      {" · "}
                      fin {formatDateFr(p.endDate)}
                    </p>
                  </>
                }
              />
            </button>
          );
        })
      )}

      <BottomSheet
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        title="Nouveau paiement échelonné"
      >
        <InstallmentPlanForm
          envelopes={envelopes}
          onDone={() => setOpenCreate(false)}
        />
      </BottomSheet>

      <BottomSheet
        open={!!edit}
        onClose={() => setEdit(null)}
        title="Modifier le plan"
      >
        {edit ? (
          <InstallmentPlanForm
            envelopes={envelopes}
            initial={{
              id: edit.id,
              name: edit.name,
              provider: edit.provider,
              providerLabel: edit.providerLabel,
              envelopeId: edit.envelopeId,
              totalAmount: edit.totalAmount,
              installmentCount: edit.installmentCount,
              firstAmount: edit.firstAmount,
              firstDueDate: edit.firstDueDate,
              frequency: edit.frequency,
              paidIndexes: edit.paidIndexes,
            }}
            onDone={() => setEdit(null)}
          />
        ) : null}
      </BottomSheet>
    </section>
  );
}
