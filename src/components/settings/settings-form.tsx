"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import { adjustAccountBalance } from "@/app/actions/balance";
import { changePassword, updateSettings } from "@/app/actions/settings";
import { ALLOCATION_PRESETS } from "@/lib/validations/entities";
import { cn, formatEuro } from "@/lib/utils";

type Settings = {
  firstName: string;
  budgetMonthStartDay: number;
  pleasurePercent: number;
  savingsPercent: number;
  debtBonusPercent: number;
  currentBalance: number;
};

export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(initial);
  const [balanceInput, setBalanceInput] = useState(
    String(initial.currentBalance).replace(".", ","),
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  function applyPreset(key: keyof typeof ALLOCATION_PRESETS) {
    const p = ALLOCATION_PRESETS[key];
    setForm((f) => ({
      ...f,
      pleasurePercent: p.pleasurePercent,
      savingsPercent: p.savingsPercent,
      debtBonusPercent: p.debtBonusPercent,
    }));
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="space-y-4">
        <CardTitle className="text-base">Solde du compte</CardTitle>
        <p className="text-sm text-muted">
          Solde suivi : {formatEuro(initial.currentBalance)}. Indique ton solde actuel
          pour recaler la référence (sans toucher à l’historique).
        </p>
        <Input
          label="Indique ton solde actuel (€)"
          inputMode="decimal"
          value={balanceInput}
          onChange={(e) => setBalanceInput(e.target.value)}
          placeholder="0,00"
        />
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await adjustAccountBalance({ amount: balanceInput });
              setMsg(r.ok ? "Solde mis à jour" : r.error);
              if (r.ok) router.refresh();
            })
          }
        >
          Mettre à jour le solde
        </Button>
      </Card>

      <Card className="space-y-4">
        <CardTitle className="text-base">Profil & budget</CardTitle>
        <Input
          label="Prénom"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />
        <Input
          label="Jour de début du mois budgétaire"
          type="number"
          min={1}
          max={28}
          value={form.budgetMonthStartDay}
          onChange={(e) =>
            setForm({ ...form, budgetMonthStartDay: Number(e.target.value) })
          }
        />

        <div>
          <p className="mb-2 text-sm font-medium">Répartition du disponible</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {(Object.keys(ALLOCATION_PRESETS) as Array<keyof typeof ALLOCATION_PRESETS>).map(
              (key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  className="touch-target inline-flex min-h-11 items-center rounded-full border border-border px-3 text-xs font-semibold"
                >
                  {ALLOCATION_PRESETS[key].label}
                </button>
              ),
            )}
          </div>
          <Slider
            label={`Plaisirs ${form.pleasurePercent} %`}
            value={form.pleasurePercent}
            onChange={(pleasurePercent) => {
              const rest = 100 - pleasurePercent;
              const sav = Math.round((rest * form.savingsPercent) / Math.max(1, form.savingsPercent + form.debtBonusPercent));
              setForm({
                ...form,
                pleasurePercent,
                savingsPercent: sav,
                debtBonusPercent: rest - sav,
              });
            }}
          />
          <Slider
            label={`Épargne ${form.savingsPercent} %`}
            value={form.savingsPercent}
            onChange={(savingsPercent) => {
              const debtBonusPercent = Math.max(
                0,
                100 - form.pleasurePercent - savingsPercent,
              );
              setForm({ ...form, savingsPercent, debtBonusPercent });
            }}
          />
          <p className="mt-2 text-sm text-muted">
            Dettes bonus : <strong>{form.debtBonusPercent} %</strong>
          </p>
        </div>

        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const { currentBalance: _balance, ...settingsPayload } = form;
              void _balance;
              const r = await updateSettings(settingsPayload);
              setMsg(r.ok ? "Réglages enregistrés" : r.error);
              if (r.ok) router.refresh();
            })
          }
        >
          Enregistrer
        </Button>
      </Card>

      <Card className="space-y-3">
        <CardTitle className="text-base">Mot de passe</CardTitle>
        <Input
          label="Actuel"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <Input
          label="Nouveau"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await changePassword({ currentPassword, newPassword });
              setMsg(r.ok ? "Mot de passe mis à jour" : r.error);
              if (r.ok) {
                setCurrentPassword("");
                setNewPassword("");
              }
            })
          }
        >
          Changer le mot de passe
        </Button>
      </Card>

      <Card>
        <CardTitle className="mb-2 text-base">Export</CardTitle>
        <a
          href="/api/export/csv"
          className={cn(
            "inline-flex h-12 w-full items-center justify-center rounded-2xl border border-border font-semibold",
          )}
        >
          Télécharger mes données (CSV)
        </a>
      </Card>

      {msg ? <p className="text-sm text-rose-deep">{msg}</p> : null}
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="mt-3 block">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-rose"
      />
    </label>
  );
}
