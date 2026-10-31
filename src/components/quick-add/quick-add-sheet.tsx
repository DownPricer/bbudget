"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { createExpense, updateExpense, deleteExpense } from "@/app/actions/expenses";
import { createIncome, updateIncome, deleteIncome } from "@/app/actions/incomes";
import { MAX_AMOUNT } from "@/lib/validations/money";
import { cn } from "@/lib/utils";

export type QuickEnvelope = {
  id: string;
  name: string;
  emoji: string;
  color: string;
};

export type EditExpense = {
  id: string;
  amount: number;
  label: string;
  envelopeId: string;
};

export type EditIncome = {
  id: string;
  amount: number;
  label: string;
  type: string;
  recurring: boolean;
  months: number[];
};

type Mode = "depense" | "rentree";

type QuickAddSheetProps = {
  open: boolean;
  onClose: () => void;
  envelopes: QuickEnvelope[];
  initialMode?: Mode;
  editExpense?: EditExpense | null;
  editIncome?: EditIncome | null;
};

const INCOME_TYPES = [
  { value: "BOURSE", label: "Bourse" },
  { value: "JOB", label: "Job" },
  { value: "CADEAU", label: "Cadeau" },
  { value: "REMBOURSEMENT_RECU", label: "Remboursement" },
  { value: "AUTRE", label: "Autre" },
] as const;

const MONTHS = [
  { n: 1, label: "Jan" },
  { n: 2, label: "Fév" },
  { n: 3, label: "Mar" },
  { n: 4, label: "Avr" },
  { n: 5, label: "Mai" },
  { n: 6, label: "Juin" },
  { n: 7, label: "Juil" },
  { n: 8, label: "Aoû" },
  { n: 9, label: "Sep" },
  { n: 10, label: "Oct" },
  { n: 11, label: "Nov" },
  { n: 12, label: "Déc" },
] as const;

function formatAmountInput(n: number) {
  return String(n).replace(".", ",");
}

function resolveIncomeType(
  type: string | undefined,
): (typeof INCOME_TYPES)[number]["value"] {
  return (
    INCOME_TYPES.find((t) => t.value === type)?.value ?? "BOURSE"
  ) as (typeof INCOME_TYPES)[number]["value"];
}

export function QuickAddSheet({
  open,
  onClose,
  envelopes,
  initialMode = "depense",
  editExpense = null,
  editIncome = null,
}: QuickAddSheetProps) {
  const router = useRouter();
  const isEdit = !!(editExpense || editIncome);
  const [mode, setMode] = useState<Mode>(
    editExpense ? "depense" : editIncome ? "rentree" : initialMode,
  );
  const [amount, setAmount] = useState(() => {
    if (editExpense) return formatAmountInput(editExpense.amount);
    if (editIncome) return formatAmountInput(editIncome.amount);
    return "";
  });
  const [label, setLabel] = useState(
    () => editExpense?.label ?? editIncome?.label ?? "",
  );
  const [envelopeId, setEnvelopeId] = useState(
    () => editExpense?.envelopeId ?? envelopes[0]?.id ?? "",
  );
  const [incomeType, setIncomeType] = useState(() =>
    resolveIncomeType(editIncome?.type),
  );
  const [recurring, setRecurring] = useState(() => editIncome?.recurring ?? false);
  const [months, setMonths] = useState<number[]>(() => editIncome?.months ?? []);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggleMonth(n: number) {
    setMonths((prev) =>
      prev.includes(n) ? prev.filter((m) => m !== n) : [...prev, n].sort((a, b) => a - b),
    );
  }

  function submit() {
    setError(null);
    const parsed = Number(amount.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Montant invalide");
      return;
    }
    if (parsed > MAX_AMOUNT) {
      setError(`Le montant ne peut pas dépasser ${MAX_AMOUNT.toLocaleString("fr-FR")} €`);
      return;
    }

    startTransition(async () => {
      if (mode === "depense") {
        if (!envelopeId) {
          setError("Choisis une enveloppe");
          return;
        }
        const result = editExpense
          ? await updateExpense({
              id: editExpense.id,
              amount,
              envelopeId,
              label: label || undefined,
            })
          : await createExpense({
              amount,
              envelopeId,
              label: label || undefined,
            });
        if (!result.ok) {
          setError(result.error);
          return;
        }
      } else {
        const result = editIncome
          ? await updateIncome({
              id: editIncome.id,
              amount,
              label: label || "Rentrée",
              type: incomeType,
              recurring,
              months: recurring ? months : [],
            })
          : await createIncome({
              amount,
              label: label || "Rentrée",
              type: incomeType,
              recurring,
              months: recurring ? months : [],
            });
        if (!result.ok) {
          setError(result.error);
          return;
        }
      }
      router.refresh();
      onClose();
    });
  }

  function onDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startTransition(async () => {
      if (editExpense) {
        const r = await deleteExpense(editExpense.id);
        if (!r.ok) {
          setError(r.error);
          return;
        }
      } else if (editIncome) {
        const r = await deleteIncome(editIncome.id);
        if (!r.ok) {
          setError(r.error);
          return;
        }
      }
      router.refresh();
      onClose();
    });
  }

  const title =
    mode === "depense"
      ? editExpense
        ? "Modifier la dépense"
        : "Nouvelle dépense"
      : editIncome
        ? "Modifier la rentrée"
        : "Nouvelle rentrée";

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-3">
        {!isEdit ? (
          <div className="grid grid-cols-2 gap-2 rounded-[14px] bg-[#f7eaf3] p-1">
            <button
              type="button"
              className={cn(
                "h-11 min-h-11 rounded-xl text-sm font-bold",
                mode === "depense" ? "bg-white text-pink shadow-sm" : "text-muted",
              )}
              onClick={() => setMode("depense")}
            >
              Dépense
            </button>
            <button
              type="button"
              className={cn(
                "h-11 min-h-11 rounded-xl text-sm font-bold",
                mode === "rentree" ? "bg-white text-pink shadow-sm" : "text-muted",
              )}
              onClick={() => setMode("rentree")}
            >
              Rentrée
            </button>
          </div>
        ) : null}

        <div className="relative">
          <input
            autoFocus={open}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
            className="h-14 w-full rounded-[19px] border border-line bg-white px-4 pr-10 text-center text-3xl font-extrabold tabular-nums text-ink placeholder:text-muted/40 focus:border-pink focus:outline-none focus:ring-2 focus:ring-pink/25"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted">
            €
          </span>
        </div>

        {mode === "depense" ? (
          <div>
            <p className="mb-2 text-xs font-bold text-[#746979]">Enveloppe</p>
            <div className="flex flex-wrap gap-2">
              {envelopes.map((env) => (
                <button
                  key={env.id}
                  type="button"
                  onClick={() => setEnvelopeId(env.id)}
                  className={cn(
                    "touch-target inline-flex h-11 min-h-11 items-center gap-1.5 rounded-full border px-3 text-sm font-bold",
                    envelopeId === env.id
                      ? "border-[#e9abc3] bg-pale text-[#bd5b83]"
                      : "border-line bg-white text-ink",
                  )}
                >
                  <span aria-hidden>{env.emoji}</span>
                  {env.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="mb-2 text-xs font-bold text-[#746979]">Type</p>
              <div className="flex flex-wrap gap-2">
                {INCOME_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setIncomeType(t.value)}
                    className={cn(
                      "touch-target h-11 min-h-11 rounded-full border px-3 text-sm font-bold",
                      incomeType === t.value
                        ? "border-[#e9abc3] bg-pale text-[#bd5b83]"
                        : "border-line bg-white",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex min-h-11 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="h-5 w-5 accent-pink"
              />
              <span className="text-sm font-semibold text-ink">
                Rentrée récurrente (mensuelle)
              </span>
            </label>

            {recurring ? (
              <div>
                <p className="mb-2 text-xs font-bold text-[#746979]">
                  Mois de versement (vide = tous les mois)
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {MONTHS.map((m) => (
                    <button
                      key={m.n}
                      type="button"
                      onClick={() => toggleMonth(m.n)}
                      className={cn(
                        "flex h-11 min-h-11 items-center justify-center rounded-xl border text-xs font-bold",
                        months.includes(m.n)
                          ? "border-[#e9abc3] bg-pale text-[#bd5b83]"
                          : "border-line bg-white text-ink",
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        <div>
          <label htmlFor="qa-label" className="mb-1.5 block text-xs font-bold text-[#746979]">
            Libellé {mode === "rentree" ? "" : "(optionnel)"}
          </label>
          <input
            id="qa-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={mode === "depense" ? "Ex. Zara, café" : "Ex. Bourse octobre"}
            className="h-11 w-full rounded-xl border border-line bg-white px-3 text-base focus:border-pink focus:outline-none focus:ring-2 focus:ring-pink/25"
          />
        </div>

        {error ? (
          <p className="rounded-[14px] bg-[#f8eaf3] px-4 py-3 text-sm text-[#8e687e]" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="button" size="lg" disabled={pending || !amount} onClick={submit}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>

        {isEdit ? (
          <Button type="button" variant="ghost" disabled={pending} onClick={onDelete}>
            {confirmDelete ? "Confirmer la suppression" : "Supprimer"}
          </Button>
        ) : null}
      </div>
    </BottomSheet>
  );
}
