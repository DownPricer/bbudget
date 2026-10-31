import type { BillingFrequency } from "@prisma/client";

export function monthlySubscriptionAmount(
  amount: number,
  frequency: BillingFrequency,
): number {
  if (frequency === "MENSUEL") return amount;
  if (frequency === "ANNUEL") return Math.round((amount / 12) * 100) / 100;
  // HEBDO
  return Math.round(((amount * 52) / 12) * 100) / 100;
}

export function yearlySubscriptionAmount(
  amount: number,
  frequency: BillingFrequency,
): number {
  if (frequency === "ANNUEL") return amount;
  if (frequency === "MENSUEL") return Math.round(amount * 12 * 100) / 100;
  return Math.round(amount * 52 * 100) / 100;
}

export function sumSubscriptionsMonthly(
  items: { amount: number; frequency: BillingFrequency; status: string }[],
): number {
  return Math.round(
    items
      .filter((s) => s.status === "ACTIF" || s.status === "A_RESILIER")
      .reduce((sum, s) => sum + monthlySubscriptionAmount(s.amount, s.frequency), 0) *
      100,
  ) / 100;
}
