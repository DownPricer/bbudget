"use client";

import { Button } from "@/components/ui/button";
import { useQuickAdd } from "@/components/quick-add/quick-add-provider";

export function AddExpenseButton() {
  const { openExpense } = useQuickAdd();
  return (
    <Button type="button" size="lg" className="mt-3" onClick={openExpense}>
      + Ajouter une dépense
    </Button>
  );
}
