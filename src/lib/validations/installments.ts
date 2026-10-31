import { z } from "zod";
import { amountSchema, dateInputSchema } from "./money";

export const installmentProviderSchema = z.enum([
  "KLARNA",
  "PAYPAL",
  "ALMA",
  "AUTRE",
]);

export const installmentFrequencySchema = z.enum([
  "MENSUELLE",
  "BI_HEBDOMADAIRE",
  "HEBDOMADAIRE",
]);

export const createInstallmentPlanSchema = z.object({
  name: z.string().trim().min(1).max(120),
  provider: installmentProviderSchema.default("AUTRE"),
  providerLabel: z.string().trim().max(40).optional(),
  envelopeId: z.string().min(1, "Choisis une enveloppe"),
  totalAmount: amountSchema,
  installmentCount: z.coerce.number().int().min(2).max(48),
  /** Si défini et ≠ montant régulier, 1ʳᵉ échéance différente */
  firstAmount: amountSchema.optional(),
  firstDueDate: dateInputSchema,
  frequency: installmentFrequencySchema.default("MENSUELLE"),
  /** Index 1-based déjà payés (pas de dépense) */
  alreadyPaidIndexes: z.array(z.number().int().min(1)).optional().default([]),
  wishItemId: z.string().optional(),
});

export const updateInstallmentPlanSchema = createInstallmentPlanSchema
  .omit({ alreadyPaidIndexes: true, wishItemId: true })
  .extend({
    id: z.string().min(1),
  });

export type CreateInstallmentPlanInput = z.infer<typeof createInstallmentPlanSchema>;
export type UpdateInstallmentPlanInput = z.infer<typeof updateInstallmentPlanSchema>;
