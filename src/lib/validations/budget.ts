import { z } from "zod";
import { amountSchema, dateInputSchema, optionalLabelSchema } from "./money";

export const incomeTypeSchema = z.enum([
  "BOURSE",
  "JOB",
  "CADEAU",
  "REMBOURSEMENT_RECU",
  "AUTRE",
]);

export const createExpenseSchema = z.object({
  amount: amountSchema,
  envelopeId: z.string().min(1, "Choisis une enveloppe"),
  label: optionalLabelSchema,
  date: dateInputSchema.optional(),
  note: z.string().trim().max(500).optional(),
});

export const updateExpenseSchema = createExpenseSchema.extend({
  id: z.string().min(1),
});

export const createIncomeSchema = z.object({
  amount: amountSchema,
  label: z.string().trim().min(1, "Libellé requis").max(120),
  type: incomeTypeSchema.default("AUTRE"),
  date: dateInputSchema.optional(),
  recurring: z.boolean().optional().default(false),
  months: z.array(z.number().int().min(1).max(12)).optional().default([]),
});

export const updateIncomeSchema = createIncomeSchema.extend({
  id: z.string().min(1),
});

export const envelopeTypeSchema = z.enum(["FIXE", "PLAISIR"]);

export const createEnvelopeSchema = z.object({
  name: z.string().trim().min(1).max(40),
  emoji: z.string().trim().min(1).max(8).default("🛍️"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Couleur invalide")
    .default("#F8C8DC"),
  monthlyAmount: amountSchema,
  type: envelopeTypeSchema.default("PLAISIR"),
});

export const updateEnvelopeSchema = createEnvelopeSchema.extend({
  id: z.string().min(1),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type CreateEnvelopeInput = z.infer<typeof createEnvelopeSchema>;
