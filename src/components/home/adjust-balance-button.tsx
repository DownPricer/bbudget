"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adjustAccountBalance } from "@/app/actions/balance";
import { formatEuro } from "@/lib/utils";

export function AdjustBalanceButton({ currentBalance }: { currentBalance: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(currentBalance).replace(".", ","));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openSheet() {
    setAmount(String(currentBalance).replace(".", ","));
    setError(null);
    setOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await adjustAccountBalance({ amount });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className="touch-target inline-flex min-h-11 items-center rounded-full border border-white/25 bg-white/10 px-3 text-xs font-bold text-white"
      >
        Ajuster
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Ajuster le solde">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Saisis le solde réel affiché par ta banque. On met à jour la référence sans
            toucher à l’historique. Solde suivi actuel : {formatEuro(currentBalance)}.
          </p>
          <Input
            label="Solde actuel (€)"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            required
          />
          <p className="text-xs text-muted">Un découvert (montant négatif) est accepté.</p>
          {error ? <p className="text-sm text-[#8e687e]">{error}</p> : null}
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer le solde"}
          </Button>
        </form>
      </BottomSheet>
    </>
  );
}
