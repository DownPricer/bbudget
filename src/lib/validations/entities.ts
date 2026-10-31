import { z } from "zod";
import { amountSchema, dateInputSchema, optionalLabelSchema } from "./money";

export const subscriptionSchema = z.object({
  name: z.string().trim().min(1).max(80),
  amount: amountSchema,
  frequency: z.enum(["MENSUEL", "ANNUEL", "HEBDO"]).default("MENSUEL"),
  billingDay: z.coerce.number().int().min(1).max(28).default(1),
  category: z.string().trim().min(1).max(40).default("Divers"),
});

export const updateSubscriptionSchema = subscriptionSchema.extend({
  id: z.string().min(1),
  status: z.enum(["ACTIF", "A_RESILIER", "RESILIE"]).optional(),
});

export const debtSchema = z.object({
  creditor: z.string().trim().min(1).max(80),
  initialAmount: amountSchema,
  remainingAmount: amountSchema.optional(),
  monthlyPayment: z
    .union([amountSchema, z.literal(""), z.null(), z.undefined()])
    .optional()
    .transform((v) => (v === "" || v == null ? undefined : v)),
  dueDate: dateInputSchema.optional().nullable(),
  note: optionalLabelSchema,
});

export const updateDebtSchema = debtSchema.extend({ id: z.string().min(1) });

export const debtPaymentSchema = z.object({
  debtId: z.string().min(1),
  amount: amountSchema,
  date: dateInputSchema.optional(),
});

export const savingsGoalSchema = z.object({
  name: z.string().trim().min(1).max(80),
  emoji: z.string().trim().min(1).max(8).default("🎯"),
  targetAmount: amountSchema,
  targetDate: dateInputSchema.optional().nullable(),
});

export const updateSavingsGoalSchema = savingsGoalSchema.extend({
  id: z.string().min(1),
});

export const savingsDepositSchema = z.object({
  goalId: z.string().min(1),
  amount: amountSchema,
  date: dateInputSchema.optional(),
});

export const wishItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  price: amountSchema,
  link: z.string().url().optional().or(z.literal("")).transform((v) => v || undefined),
  photoUrl: z.string().optional(),
  envelopeId: z.string().optional(),
});

export const wishDecisionSchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["ACHETE", "ABANDONNE"]),
});

export const settingsSchema = z.object({
  firstName: z.string().trim().min(1).max(50),
  budgetMonthStartDay: z.coerce.number().int().min(1).max(28),
  pleasurePercent: z.coerce.number().int().min(0).max(100),
  savingsPercent: z.coerce.number().int().min(0).max(100),
  debtBonusPercent: z.coerce.number().int().min(0).max(100),
}).refine(
  (v) => v.pleasurePercent + v.savingsPercent + v.debtBonusPercent === 100,
  { message: "La répartition doit totaliser 100 %" },
);

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[a-zA-Z]/)
    .regex(/[0-9]/),
});

export const challengeStartSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  durationDays: z.coerce.number().int().min(1).max(90),
});

export const ALLOCATION_PRESETS = {
  douce: { pleasurePercent: 70, savingsPercent: 20, debtBonusPercent: 10, label: "Douce" },
  equilibree: { pleasurePercent: 60, savingsPercent: 25, debtBonusPercent: 15, label: "Équilibrée" },
  dettes: { pleasurePercent: 40, savingsPercent: 20, debtBonusPercent: 40, label: "Je veux finir mes dettes vite" },
} as const;
