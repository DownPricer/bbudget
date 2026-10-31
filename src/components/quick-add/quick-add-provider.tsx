"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { InstallmentPlanForm } from "@/components/installments/installment-plan-form";
import {
  QuickAddSheet,
  type EditExpense,
  type EditIncome,
  type QuickEnvelope,
} from "./quick-add-sheet";

type Mode = "depense" | "rentree" | null;

type InstallmentDefaults = {
  name?: string;
  totalAmount?: string;
  envelopeId?: string;
  wishItemId?: string;
};

type QuickAddContextValue = {
  openExpense: () => void;
  openIncome: () => void;
  openExpenseEdit: (expense: EditExpense) => void;
  openIncomeEdit: (income: EditIncome) => void;
  openInstallmentPlan: (defaults?: InstallmentDefaults) => void;
};

const QuickAddContext = createContext<QuickAddContextValue | null>(null);

export function useQuickAdd() {
  const ctx = useContext(QuickAddContext);
  if (!ctx) throw new Error("useQuickAdd must be used within QuickAddProvider");
  return ctx;
}

export function QuickAddProvider({
  envelopes,
  children,
}: {
  envelopes: QuickEnvelope[];
  children: ReactNode;
}) {
  const [mode, setMode] = useState<Mode>(null);
  const [editExpense, setEditExpense] = useState<EditExpense | null>(null);
  const [editIncome, setEditIncome] = useState<EditIncome | null>(null);
  const [installmentOpen, setInstallmentOpen] = useState(false);
  const [installmentDefaults, setInstallmentDefaults] =
    useState<InstallmentDefaults | undefined>();

  const close = useCallback(() => {
    setMode(null);
    setEditExpense(null);
    setEditIncome(null);
  }, []);

  const value = useMemo(
    () => ({
      openExpense: () => {
        setEditExpense(null);
        setEditIncome(null);
        setMode("depense");
      },
      openIncome: () => {
        setEditExpense(null);
        setEditIncome(null);
        setMode("rentree");
      },
      openExpenseEdit: (expense: EditExpense) => {
        setEditIncome(null);
        setEditExpense(expense);
        setMode("depense");
      },
      openIncomeEdit: (income: EditIncome) => {
        setEditExpense(null);
        setEditIncome(income);
        setMode("rentree");
      },
      openInstallmentPlan: (defaults?: InstallmentDefaults) => {
        setMode(null);
        setEditExpense(null);
        setEditIncome(null);
        setInstallmentDefaults(defaults);
        setInstallmentOpen(true);
      },
    }),
    [],
  );

  const sheetKey = editExpense?.id ?? editIncome?.id ?? mode ?? "closed";

  return (
    <QuickAddContext.Provider value={value}>
      {children}
      <QuickAddSheet
        key={sheetKey}
        open={mode !== null}
        initialMode={mode === "rentree" ? "rentree" : "depense"}
        onClose={close}
        envelopes={envelopes}
        editExpense={editExpense}
        editIncome={editIncome}
        onOpenInstallment={() => {
          close();
          setInstallmentDefaults(undefined);
          setInstallmentOpen(true);
        }}
      />
      <BottomSheet
        open={installmentOpen}
        onClose={() => setInstallmentOpen(false)}
        title="Paiement en plusieurs fois"
      >
        <InstallmentPlanForm
          key={JSON.stringify(installmentDefaults ?? {})}
          envelopes={envelopes}
          defaults={installmentDefaults}
          onDone={() => setInstallmentOpen(false)}
        />
      </BottomSheet>
    </QuickAddContext.Provider>
  );
}
