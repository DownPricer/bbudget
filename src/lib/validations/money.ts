import { z } from "zod";

/** Plafond serveur des montants (dépenses, rentrées, enveloppes, etc.). */
export const MAX_AMOUNT = 100_000;

function parseAmount(v: string | number): number | null {
  const raw =
    typeof v === "number" ? String(v) : v.trim().replace(/\s/g, "").replace(",", ".");
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

/** Parse un montant saisi (virgule ou point) → nombre positif ≤ 100 000 €. */
export const amountSchema = z
  .union([z.string(), z.number()])
  .refine((v) => parseAmount(v) !== null, { message: "Montant invalide" })
  .transform((v) => parseAmount(v) as number)
  .refine((n) => n <= MAX_AMOUNT, {
    message: `Le montant ne peut pas dépasser ${MAX_AMOUNT.toLocaleString("fr-FR")} €`,
  });

function parseSignedAmount(v: string | number): number | null {
  const raw =
    typeof v === "number" ? String(v) : v.trim().replace(/\s/g, "").replace(",", ".");
  if (raw === "" || raw === "-" || raw === "." || raw === "-.") return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

/** Solde bancaire : zéro et négatif (découvert) autorisés, |montant| ≤ 100 000 €. */
export const balanceAmountSchema = z
  .union([z.string(), z.number()])
  .refine((v) => parseSignedAmount(v) !== null, { message: "Solde invalide" })
  .transform((v) => parseSignedAmount(v) as number)
  .refine((n) => Math.abs(n) <= MAX_AMOUNT, {
    message: `Le solde ne peut pas dépasser ${MAX_AMOUNT.toLocaleString("fr-FR")} €`,
  });

export const optionalLabelSchema = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const dateInputSchema = z
  .union([z.string(), z.date()])
  .refine((v) => {
    const d = v instanceof Date ? v : new Date(v);
    return !Number.isNaN(d.getTime());
  }, { message: "Date invalide" })
  .transform((v) => (v instanceof Date ? v : new Date(v)));
