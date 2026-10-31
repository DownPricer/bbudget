"use client";

import { useQuickAdd } from "@/components/quick-add/quick-add-provider";
import { ListRow } from "@/components/ui/list-row";
import { formatDateFr, formatEuro } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  BOURSE: "Bourse",
  JOB: "Job",
  CADEAU: "Cadeau",
  REMBOURSEMENT_RECU: "Remboursement",
  AUTRE: "Autre",
};

type IncomeRowProps = {
  id: string;
  label: string;
  amount: number;
  date: string;
  type: string;
  recurring: boolean;
  months?: number[];
};

export function IncomeRow({
  id,
  label,
  amount,
  date,
  type,
  recurring,
  months = [],
}: IncomeRowProps) {
  const { openIncomeEdit } = useQuickAdd();

  return (
    <button
      type="button"
      className="touch-target w-full min-h-11 text-left"
      onClick={() =>
        openIncomeEdit({
          id,
          amount,
          label,
          type,
          recurring,
          months,
        })
      }
    >
      <ListRow
        icon="€"
        title={label}
        subtitle={`${TYPE_LABELS[type] ?? type}${recurring ? " · récurrente" : ""} · ${formatDateFr(date)}`}
        value={`+${formatEuro(amount)}`}
      />
    </button>
  );
}
