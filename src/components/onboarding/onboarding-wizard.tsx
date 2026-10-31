"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { completeOnboarding } from "@/app/actions/onboarding";
import { SUBSCRIPTION_SUGGESTIONS } from "@/lib/tips";
import { cn } from "@/lib/utils";

const DEFAULT_ENVELOPES = [
  { name: "Fringues", emoji: "👗", color: "#F8C8DC", monthlyAmount: "80" },
  { name: "Cosméto", emoji: "💄", color: "#E8D5F2", monthlyAmount: "40" },
  { name: "Sorties", emoji: "🍹", color: "#B8E0D2", monthlyAmount: "60" },
  { name: "Divers", emoji: "🛍️", color: "#FFE5B4", monthlyAmount: "30" },
];

type SubPick = { name: string; amount: number; category: string };

export function OnboardingWizard({ firstName }: { firstName: string }) {
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [accountBalance, setAccountBalance] = useState("0");
  const [incomeAmount, setIncomeAmount] = useState("550");
  const [subs, setSubs] = useState<SubPick[]>([]);
  const [debtCreditor, setDebtCreditor] = useState("");
  const [debtAmount, setDebtAmount] = useState("");
  const [envelopes, setEnvelopes] = useState(DEFAULT_ENVELOPES);
  const [savingsName, setSavingsName] = useState("Coussin de sécurité");
  const [savingsTarget, setSavingsTarget] = useState("300");

  const steps = ["Solde", "Rentrées", "Abonnements", "Dettes", "Enveloppes", "Épargne"];
  const progress = ((step + 1) / steps.length) * 100;

  function toggleSub(s: (typeof SUBSCRIPTION_SUGGESTIONS)[number]) {
    setSubs((prev) =>
      prev.some((p) => p.name === s.name)
        ? prev.filter((p) => p.name !== s.name)
        : [...prev, { name: s.name, amount: s.amount, category: s.category }],
    );
  }

  function finish() {
    setError(null);
    startTransition(async () => {
      const result = await completeOnboarding({
        accountBalance,
        incomeAmount: incomeAmount || undefined,
        incomeLabel: "Bourse CROUS",
        subscriptions: subs,
        debts:
          debtCreditor && debtAmount
            ? [{ creditor: debtCreditor, amount: debtAmount }]
            : [],
        envelopes,
        savingsName,
        savingsEmoji: "○",
        savingsTarget: savingsTarget || undefined,
      });
      if (result && "ok" in result && result.ok === false) {
        setError(result.error);
      }
    });
  }

  return (
    <div
      className="scroll-area mx-auto flex h-full max-h-dvh w-full max-w-[var(--app-max)] flex-col overflow-y-auto bg-background px-5 py-6 md:rounded-[30px] md:shadow-[0_25px_70px_#60445c22]"
      style={{
        paddingTop: "calc(1.5rem + var(--safe-top))",
        paddingBottom: "calc(1.5rem + var(--safe-bottom))",
      }}
    >
      <p className="text-xs text-muted">Bienvenue {firstName}</p>
      <h1 className="mt-1 text-[25px] font-extrabold tracking-[-0.8px] text-ink">
        Configuration
      </h1>

      <div className="mt-4 h-1.5 overflow-hidden rounded-[10px] bg-[#f5eff3]">
        <div
          className="h-full rounded-[10px] bg-pink transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted">
        Étape {step + 1}/{steps.length} · {steps[step]}
      </p>

      <div className="mt-6 flex-1">
        {step === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Indique ton solde actuel (celui de ta banque). Un découvert est accepté.
            </p>
            <Input
              label="Solde actuel (€)"
              inputMode="decimal"
              value={accountBalance}
              onChange={(e) => setAccountBalance(e.target.value)}
              placeholder="0,00"
            />
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Ta bourse ou ton revenu principal. Tu pourras ajuster plus tard.
            </p>
            <Input
              label="Montant de la bourse (€)"
              inputMode="decimal"
              value={incomeAmount}
              onChange={(e) => setIncomeAmount(e.target.value)}
            />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">Coche ce que tu as déjà :</p>
            <div className="flex flex-wrap gap-2">
              {SUBSCRIPTION_SUGGESTIONS.map((s) => {
                const on = subs.some((p) => p.name === s.name);
                return (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => toggleSub(s)}
                    className={cn(
                      "touch-target min-h-11 rounded-full border px-3 text-sm font-semibold",
                      on ? "border-rose bg-rose-soft text-rose-deep" : "border-border bg-card",
                    )}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Une dette à rembourser ? Sinon, passe à la suite.
            </p>
            <Input
              label="À qui ?"
              value={debtCreditor}
              onChange={(e) => setDebtCreditor(e.target.value)}
              placeholder="Parents, amie…"
            />
            <Input
              label="Combien reste-t-il ?"
              inputMode="decimal"
              value={debtAmount}
              onChange={(e) => setDebtAmount(e.target.value)}
            />
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">Tes enveloppes plaisirs (modifiables) :</p>
            {envelopes.map((env, i) => (
              <div key={env.name} className="flex items-center gap-2 rounded-2xl bg-card p-3 border border-border/60">
                <span className="text-xl">{env.emoji}</span>
                <span className="flex-1 font-semibold">{env.name}</span>
                <input
                  inputMode="decimal"
                  className="h-11 w-24 rounded-xl border border-border px-2 text-right tabular-nums"
                  value={env.monthlyAmount}
                  onChange={(e) => {
                    const next = [...envelopes];
                    next[i] = { ...env, monthlyAmount: e.target.value };
                    setEnvelopes(next);
                  }}
                />
              </div>
            ))}
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">Un premier objectif d’épargne :</p>
            <Input
              label="Nom"
              value={savingsName}
              onChange={(e) => setSavingsName(e.target.value)}
            />
            <Input
              label="Montant cible (€)"
              inputMode="decimal"
              value={savingsTarget}
              onChange={(e) => setSavingsTarget(e.target.value)}
            />
          </div>
        ) : null}
      </div>

      {error ? <p className="mt-2 text-sm text-[#C9956C]">{error}</p> : null}

      <div className="mt-6 flex gap-3">
        {step > 0 ? (
          <Button variant="outline" className="flex-1" onClick={() => setStep((s) => s - 1)}>
            Retour
          </Button>
        ) : null}
        {step < steps.length - 1 ? (
          <Button className="flex-1" onClick={() => setStep((s) => s + 1)}>
            Continuer
          </Button>
        ) : (
          <Button className="flex-1" disabled={pending} onClick={finish}>
            {pending ? "Enregistrement…" : "Terminer"}
          </Button>
        )}
      </div>
    </div>
  );
}
