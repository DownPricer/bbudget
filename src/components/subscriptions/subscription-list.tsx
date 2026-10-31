"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { HeroDark } from "@/components/ui/hero-dark";
import { Input } from "@/components/ui/input";
import { ListRow } from "@/components/ui/list-row";
import {
  createSubscription,
  setSubscriptionStatus,
} from "@/app/actions/subscriptions";
import { formatEuro } from "@/lib/utils";
import {
  monthlySubscriptionAmount,
  yearlySubscriptionAmount,
} from "@/lib/budget/subscriptions";
import { SUBSCRIPTION_SUGGESTIONS } from "@/lib/tips";
import { cn } from "@/lib/utils";

type Sub = {
  id: string;
  name: string;
  amount: number;
  frequency: "MENSUEL" | "ANNUEL" | "HEBDO";
  billingDay: number;
  category: string;
  status: "ACTIF" | "A_RESILIER" | "RESILIE";
};

export function SubscriptionList({ subscriptions }: { subscriptions: Sub[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const active = subscriptions.filter((s) => s.status !== "RESILIE");
  const monthly = active.reduce(
    (sum, s) => sum + monthlySubscriptionAmount(s.amount, s.frequency),
    0,
  );
  const yearly = active.reduce(
    (sum, s) => sum + yearlySubscriptionAmount(s.amount, s.frequency),
    0,
  );

  function add(rawName: string, rawAmount: number, category = "Divers") {
    setError(null);
    startTransition(async () => {
      const result = await createSubscription({
        name: rawName,
        amount: rawAmount,
        category,
        frequency: "MENSUEL",
        billingDay: 1,
      });
      if (!result.ok) setError(result.error);
      else {
        setName("");
        setAmount("");
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div>
      <HeroDark
        label="Coût mensuel"
        value={formatEuro(monthly)}
        hint={`Soit ${formatEuro(yearly)} par an`}
      />

      <section className="mt-2">
        <h2 className="mb-3 text-base font-bold text-ink">Prochains prélèvements</h2>
        {subscriptions.length === 0 ? (
          <p className="rounded-[19px] border border-line bg-white p-[15px] text-[11px] text-muted">
            Aucun abonnement suivi.
          </p>
        ) : (
          subscriptions.map((s) => (
            <ListRow
              key={s.id}
              icon="▣"
              title={s.name}
              subtitle={`Le ${s.billingDay} du mois · ${s.category}${
                s.status === "RESILIE" ? " · retiré" : s.status === "A_RESILIER" ? " · à résilier" : ""
              }`}
              value={formatEuro(s.amount)}
              className={cn(s.status === "RESILIE" && "opacity-60")}
              footer={
                s.status !== "RESILIE" ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await setSubscriptionStatus(s.id, "RESILIE");
                        router.refresh();
                      })
                    }
                    className="mt-3 w-full rounded-[14px] border border-dashed border-[#ddcedb] py-2.5 text-sm font-bold text-[#8d637e]"
                  >
                    Retirer du suivi
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await setSubscriptionStatus(s.id, "ACTIF");
                        router.refresh();
                      })
                    }
                    className="mt-3 w-full rounded-[14px] border border-dashed border-[#ddcedb] py-2.5 text-sm font-bold text-[#8d637e]"
                  >
                    Remettre en suivi
                  </button>
                )
              }
            />
          ))
        )}
      </section>

      <Button type="button" size="lg" className="mt-3" onClick={() => setOpen(true)}>
        + Ajouter un abonnement
      </Button>

      <p className="mt-4 rounded-[17px] bg-[#f8eaf3] px-3.5 py-3.5 text-xs text-[#8e687e]">
        Un abonnement retiré du suivi doit être résilié auprès du service concerné.
      </p>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Nouvel abonnement">
        <div className="mb-4 flex flex-wrap gap-2">
          {SUBSCRIPTION_SUGGESTIONS.map((s) => (
            <button
              key={s.name}
              type="button"
              disabled={pending}
              onClick={() => add(s.name, s.amount, s.category)}
              className="rounded-full border border-line bg-white px-3 py-2 text-sm font-semibold text-[#756b7b]"
            >
              + {s.name}
            </button>
          ))}
        </div>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            add(name, Number(amount.replace(",", ".")), "Divers");
          }}
        >
          <Input label="Nom" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="Prix mensuel"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          {error ? <p className="text-sm text-[#C9956C]">{error}</p> : null}
          <Button type="submit" size="lg" disabled={pending}>
            Enregistrer
          </Button>
        </form>
      </BottomSheet>
    </div>
  );
}
