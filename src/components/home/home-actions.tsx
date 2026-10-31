"use client";

import { Button } from "@/components/ui/button";
import { useQuickAdd } from "@/components/quick-add/quick-add-provider";

export function HomeActions() {
  const { openExpense, openIncome } = useQuickAdd();

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <Button type="button" onClick={openExpense}>
        + Dépense
      </Button>
      <Button type="button" variant="mint" onClick={openIncome}>
        + Rentrée
      </Button>
    </div>
  );
}
