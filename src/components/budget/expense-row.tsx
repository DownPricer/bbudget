"use client";

import { useQuickAdd } from "@/components/quick-add/quick-add-provider";
import { ListRow } from "@/components/ui/list-row";
import { formatDateFr, formatEuro } from "@/lib/utils";

type ExpenseRowProps = {
  id: string;
  label: string;
  amount: number;
  date: string;
  envelopeId: string;
  envelopeEmoji: string;
  envelopeName: string;
};

export function ExpenseRow({
  id,
  label,
  amount,
  date,
  envelopeId,
  envelopeEmoji,
  envelopeName,
}: ExpenseRowProps) {
  const { openExpenseEdit } = useQuickAdd();

  return (
    <button
      type="button"
      className="touch-target w-full min-h-11 text-left"
      onClick={() =>
        openExpenseEdit({ id, amount, label, envelopeId })
      }
    >
      <ListRow
        icon={envelopeEmoji}
        title={label}
        subtitle={`${envelopeName} · ${formatDateFr(date)}`}
        value={formatEuro(amount)}
      />
    </button>
  );
}
