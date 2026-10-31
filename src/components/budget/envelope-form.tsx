"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createEnvelope,
  updateEnvelope,
  deleteEnvelope,
} from "@/app/actions/envelopes";
import { MAX_AMOUNT } from "@/lib/validations/money";

const PASTEL_COLORS = ["#F8C8DC", "#E8D5F2", "#B8E0D2", "#FFE5B4", "#C5E4F3", "#F5D0C5"];
const EMOJI_SUGGESTIONS = ["👗", "💄", "🍹", "🛍️", "📚", "🚌", "🍕", "🎮"];

type EnvelopeFormProps = {
  initial?: {
    id: string;
    name: string;
    emoji: string;
    color: string;
    monthlyAmount: number;
  };
  onDone?: () => void;
};

export function EnvelopeForm({ initial, onDone }: EnvelopeFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "🛍️");
  const [color, setColor] = useState(initial?.color ?? PASTEL_COLORS[0]);
  const [amount, setAmount] = useState(
    initial ? String(initial.monthlyAmount).replace(".", ",") : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = Number(amount.replace(",", "."));
    if (Number.isFinite(parsed) && parsed > MAX_AMOUNT) {
      setError(`Le montant ne peut pas dépasser ${MAX_AMOUNT.toLocaleString("fr-FR")} €`);
      return;
    }
    startTransition(async () => {
      const payload = {
        ...(initial ? { id: initial.id } : {}),
        name,
        emoji,
        color,
        monthlyAmount: amount,
        type: "PLAISIR" as const,
      };
      const result = initial
        ? await updateEnvelope(payload)
        : await createEnvelope(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      onDone?.();
    });
  }

  function onDelete() {
    if (!initial) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteEnvelope(initial.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      onDone?.();
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input label="Nom" value={name} onChange={(e) => setName(e.target.value)} required />
      <div>
        <p className="mb-1.5 text-sm font-medium text-foreground/80">Emoji</p>
        <div className="flex flex-wrap gap-2">
          {EMOJI_SUGGESTIONS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => setEmoji(em)}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg ${
                emoji === em ? "bg-rose-soft ring-2 ring-rose" : "bg-cream"
              }`}
            >
              {em}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-sm font-medium text-foreground/80">Couleur</p>
        <div className="flex flex-wrap gap-2">
          {PASTEL_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-11 w-11 rounded-full border-2 ${
                color === c ? "border-foreground/40" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
        </div>
      </div>
      <Input
        label="Montant prévu / mois"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        placeholder="80"
      />
      {error ? <p className="text-sm text-[#C9956C]">{error}</p> : null}
      <Button type="submit" disabled={pending} size="lg">
        {pending ? "Enregistrement…" : initial ? "Enregistrer" : "Créer l’enveloppe"}
      </Button>
      {initial ? (
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={onDelete}
          className="text-[#C9956C]"
        >
          Supprimer
        </Button>
      ) : null}
    </form>
  );
}
