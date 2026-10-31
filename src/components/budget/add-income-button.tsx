"use client";

import { Button } from "@/components/ui/button";
import { useQuickAdd } from "@/components/quick-add/quick-add-provider";

export function AddIncomeButton() {
  const { openIncome } = useQuickAdd();
  return (
    <Button type="button" size="lg" variant="mint" className="mt-3" onClick={openIncome}>
      + Ajouter une rentrée
    </Button>
  );
}
