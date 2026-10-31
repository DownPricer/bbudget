"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createInstallmentPlan,
  updateInstallmentPlan,
  cancelInstallmentPlan,
} from "@/app/actions/installments";
import {
  generateInstallmentSchedule,
  type InstallmentFrequency,
} from "@/lib/budget/installments";
import { cn, formatEuro } from "@/lib/utils";

const PROVIDERS = [
  { value: "KLARNA", label: "Klarna" },
  { value: "PAYPAL", label: "PayPal" },
  { value: "ALMA", label: "Alma" },
  { value: "AUTRE", label: "Autre" },
] as const;

const FREQUENCIES: { value: InstallmentFrequency; label: string }[] = [
  { value: "MENSUELLE", label: "Mensuelle" },
  { value: "BI_HEBDOMADAIRE", label: "Toutes les 2 semaines" },
  { value: "HEBDOMADAIRE", label: "Hebdomadaire" },
];

export type InstallmentEnvelope = { id: string; name: string; emoji: string };

type EditPlan = {
  id: string;
  name: string;
  provider: string;
  providerLabel?: string | null;
  envelopeId: string;
  totalAmount: number;
  installmentCount: number;
  firstAmount: number;
  firstDueDate: string;
  frequency: InstallmentFrequency;
  paidIndexes: number[];
};

export function InstallmentPlanForm({
  envelopes,
  initial,
  defaults,
  onDone,
}: {
  envelopes: InstallmentEnvelope[];
  initial?: EditPlan | null;
  defaults?: {
    name?: string;
    totalAmount?: string;
    envelopeId?: string;
    wishItemId?: string;
  };
  onDone?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initial?.name ?? defaults?.name ?? "");
  const [provider, setProvider] =
    useState<(typeof PROVIDERS)[number]["value"]>(
      (initial?.provider as (typeof PROVIDERS)[number]["value"]) ?? "KLARNA",
    );
  const [providerLabel, setProviderLabel] = useState(initial?.providerLabel ?? "");
  const [envelopeId, setEnvelopeId] = useState(
    initial?.envelopeId ?? defaults?.envelopeId ?? envelopes[0]?.id ?? "",
  );
  const [totalAmount, setTotalAmount] = useState(
    initial
      ? String(initial.totalAmount).replace(".", ",")
      : (defaults?.totalAmount ?? ""),
  );
  const [count, setCount] = useState(String(initial?.installmentCount ?? 3));
  const [customFirst, setCustomFirst] = useState(
    initial
      ? Math.abs(initial.firstAmount - initial.totalAmount / initial.installmentCount) > 0.02
      : false,
  );
  const [firstAmount, setFirstAmount] = useState(
    initial ? String(initial.firstAmount).replace(".", ",") : "",
  );
  const [firstDue, setFirstDue] = useState(
    initial
      ? initial.firstDueDate.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  );
  const [frequency, setFrequency] = useState<InstallmentFrequency>(
    initial?.frequency ?? "MENSUELLE",
  );
  const [alreadyPaid, setAlreadyPaid] = useState<number[]>(
    initial?.paidIndexes ?? [],
  );

  const preview = useMemo(() => {
    const total = Number(totalAmount.replace(",", "."));
    const n = Number(count);
    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(n) || n < 2) {
      return [];
    }
    try {
      const first = customFirst
        ? Number(firstAmount.replace(",", "."))
        : undefined;
      return generateInstallmentSchedule({
        totalAmount: total,
        installmentCount: n,
        firstDueDate: new Date(firstDue + "T12:00:00"),
        frequency,
        firstAmount:
          customFirst && Number.isFinite(first) && (first as number) > 0
            ? first
            : undefined,
      });
    } catch {
      return [];
    }
  }, [totalAmount, count, customFirst, firstAmount, firstDue, frequency]);

  function togglePaid(index: number) {
    if (initial) return;
    setAlreadyPaid((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index].sort(),
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const payload = {
        name,
        provider,
        providerLabel: provider === "AUTRE" ? providerLabel : undefined,
        envelopeId,
        totalAmount,
        installmentCount: count,
        firstAmount: customFirst && firstAmount ? firstAmount : undefined,
        firstDueDate: firstDue,
        frequency,
      };
      const result = initial
        ? await updateInstallmentPlan({ id: initial.id, ...payload })
        : await createInstallmentPlan({
            ...payload,
            alreadyPaidIndexes: alreadyPaid,
            wishItemId: defaults?.wishItemId,
          });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      onDone?.();
    });
  }

  function onCancel() {
    if (!initial) return;
    setError(null);
    startTransition(async () => {
      const r = await cancelInstallmentPlan(initial.id);
      if (!r.ok) setError(r.error);
      else {
        router.refresh();
        onDone?.();
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <Input label="Nom de l’achat" value={name} onChange={(e) => setName(e.target.value)} required />

      <div>
        <p className="mb-2 text-xs font-bold text-[#746979]">Service</p>
        <div className="flex flex-wrap gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setProvider(p.value)}
              className={cn(
                "touch-target h-11 min-h-11 rounded-full border px-3 text-sm font-bold",
                provider === p.value
                  ? "border-[#e9abc3] bg-pale text-[#bd5b83]"
                  : "border-line bg-white",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        {provider === "AUTRE" ? (
          <Input
            className="mt-2"
            label="Préciser"
            value={providerLabel}
            onChange={(e) => setProviderLabel(e.target.value)}
          />
        ) : null}
      </div>

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
                  : "border-line bg-white",
              )}
            >
              <span aria-hidden>{env.emoji}</span>
              {env.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Montant total (€)"
          inputMode="decimal"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          required
        />
        <Input
          label="Nb d’échéances"
          inputMode="numeric"
          value={count}
          onChange={(e) => setCount(e.target.value.replace(/\D/g, ""))}
          required
        />
      </div>

      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={customFirst}
          onChange={(e) => setCustomFirst(e.target.checked)}
          className="h-5 w-5 accent-pink"
        />
        <span className="text-sm font-semibold text-ink">
          1ʳᵉ échéance différente des autres
        </span>
      </label>
      {customFirst ? (
        <Input
          label="Montant 1ʳᵉ échéance (€)"
          inputMode="decimal"
          value={firstAmount}
          onChange={(e) => setFirstAmount(e.target.value)}
        />
      ) : null}

      <Input
        label="Date de la 1ʳᵉ échéance"
        type="date"
        value={firstDue}
        onChange={(e) => setFirstDue(e.target.value)}
        required
      />

      <div>
        <p className="mb-2 text-xs font-bold text-[#746979]">Fréquence</p>
        <div className="flex flex-wrap gap-2">
          {FREQUENCIES.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFrequency(f.value)}
              className={cn(
                "touch-target h-11 min-h-11 rounded-full border px-3 text-sm font-bold",
                frequency === f.value
                  ? "border-[#e9abc3] bg-pale text-[#bd5b83]"
                  : "border-line bg-white",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {preview.length > 0 ? (
        <div className="rounded-[14px] border border-line bg-white p-3">
          <p className="mb-2 text-xs font-bold text-[#746979]">
            Échéances
            {preview.at(-1)
              ? ` · fin le ${preview.at(-1)!.dueDate.toLocaleDateString("fr-FR")}`
              : ""}
          </p>
          <ul className="flex flex-col gap-1.5">
            {preview.map((p) => {
              const checked = alreadyPaid.includes(p.index);
              return (
                <li key={p.index} className="flex items-center gap-2 text-sm">
                  {!initial ? (
                    <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePaid(p.index)}
                        className="h-5 w-5 accent-pink"
                      />
                      <span className={checked ? "text-muted line-through" : "text-ink"}>
                        {p.index}/{preview.length} ·{" "}
                        {p.dueDate.toLocaleDateString("fr-FR")} · {formatEuro(p.amount)}
                        {checked ? " (déjà payée)" : ""}
                      </span>
                    </label>
                  ) : (
                    <span className="text-ink">
                      {p.index}/{preview.length} ·{" "}
                      {p.dueDate.toLocaleDateString("fr-FR")} · {formatEuro(p.amount)}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {!initial ? (
            <p className="mt-2 text-[11px] text-muted">
              Coche les échéances déjà passées : elles ne créeront pas de dépense.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-[#8e687e]">{error}</p> : null}

      <Button type="submit" size="lg" disabled={pending || !name || !totalAmount || !envelopeId}>
        {pending ? "Enregistrement…" : initial ? "Enregistrer" : "Créer le plan"}
      </Button>
      {initial && initial.paidIndexes.length < initial.installmentCount ? (
        <Button type="button" variant="ghost" disabled={pending} onClick={onCancel}>
          Annuler le plan (remboursement / retour)
        </Button>
      ) : null}
    </form>
  );
}
