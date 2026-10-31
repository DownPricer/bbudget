/**
 * Cœur du calcul budgétaire — fonctions pures, testables sans DB.
 */

import { sumUpcomingInstallmentsInPeriod } from "./installments";
import { monthlySubscriptionAmount } from "./subscriptions";

export type AllocationSettings = {
  pleasurePercent: number;
  savingsPercent: number;
  debtBonusPercent: number;
};

export type EnvelopeSnapshot = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  type: "PLAISIR" | "FIXE";
  monthlyAmount: number;
  spent: number;
};

export type EnvelopeStatus = EnvelopeSnapshot & {
  remaining: number;
  progress: number; // 0–1+, >1 = dépassée
  isOver: boolean;
};

export type SpendableLimitedBy = "balance" | "envelopes" | "zero";

export type BudgetSummary = {
  incomesTotal: number;
  mandatoryCharges: number;
  available: number;
  isTightMonth: boolean;
  allocation: {
    pleasure: number;
    savings: number;
    debtBonus: number;
  };
  pleasureBudgeted: number;
  pleasureSpent: number;
  /** Chiffre roi : max(0, min(argent libre, reste enveloppes)) */
  remainingToSpend: number;
  envelopes: EnvelopeStatus[];
  currentBalance: number;
  upcomingWithdrawals: number;
  freeMoney: number;
  envelopeRemaining: number;
  spendableLimitedBy: SpendableLimitedBy;
  spendableHint: string;
};

export type SubscriptionChargeInput = {
  amount: number;
  frequency: "MENSUEL" | "ANNUEL" | "HEBDO";
  billingDay: number;
  status: string;
};

export type DebtChargeInput = {
  monthlyPayment: number;
  remainingAmount: number;
  /** True si une mensualité a déjà été enregistrée sur la période */
  paidInPeriod: boolean;
};

export type InstallmentChargeInput = {
  status: string;
  amount: number;
  dueDate: Date;
};

export type SpendableDashboardInput = {
  openingBalance: number;
  incomesSinceOpening: number;
  expensesSinceOpening: number;
  /** Instant « maintenant » pour savoir ce qui a déjà été prélevé */
  today: Date;
  periodStart: Date;
  periodEnd: Date;
  subscriptions: SubscriptionChargeInput[];
  debts: DebtChargeInput[];
  /** Échéances A_VENIR des plans EN_COURS */
  installmentPayments?: InstallmentChargeInput[];
  envelopes: EnvelopeSnapshot[];
  incomesTotal: number;
  allocation: AllocationSettings;
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function allocateAvailable(
  available: number,
  allocation: AllocationSettings,
): { pleasure: number; savings: number; debtBonus: number } {
  if (available <= 0) {
    return { pleasure: 0, savings: 0, debtBonus: 0 };
  }
  const pleasure = round2((available * allocation.pleasurePercent) / 100);
  const savings = round2((available * allocation.savingsPercent) / 100);
  const debtBonus = round2(available - pleasure - savings);
  return { pleasure, savings, debtBonus };
}

export function buildEnvelopeStatuses(
  envelopes: EnvelopeSnapshot[],
): EnvelopeStatus[] {
  return envelopes.map((env) => {
    const remaining = round2(env.monthlyAmount - env.spent);
    const progress =
      env.monthlyAmount > 0 ? env.spent / env.monthlyAmount : env.spent > 0 ? 1 : 0;
    return {
      ...env,
      remaining,
      progress,
      isOver: env.spent > env.monthlyAmount,
    };
  });
}

/** Solde actuel = solde de départ + rentrées − dépenses depuis la date de référence. */
export function calculateCurrentBalance(
  openingBalance: number,
  incomesSinceOpening: number,
  expensesSinceOpening: number,
): number {
  return round2(openingBalance + incomesSinceOpening - expensesSinceOpening);
}

/**
 * True si le jour de prélèvement est déjà passé entre periodStart et today (inclus).
 */
export function hasBillingDayOccurred(
  billingDay: number,
  periodStart: Date,
  today: Date,
): boolean {
  const day = Math.min(28, Math.max(1, Math.floor(billingDay)));
  const start = new Date(periodStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  if (end < start) return false;

  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    if (cursor.getDate() === day) return true;
    cursor.setDate(cursor.getDate() + 1);
  }
  return false;
}

/** Prélèvements encore à venir sur le reste de la période budgétaire. */
export function calculateUpcomingWithdrawals(input: {
  today: Date;
  periodStart: Date;
  periodEnd: Date;
  subscriptions: SubscriptionChargeInput[];
  debts: DebtChargeInput[];
  installmentPayments?: InstallmentChargeInput[];
}): number {
  let total = 0;

  for (const s of input.subscriptions) {
    if (s.status !== "ACTIF" && s.status !== "A_RESILIER") continue;
    const occursThisPeriod = hasBillingDayOccurred(
      s.billingDay,
      input.periodStart,
      input.periodEnd,
    );
    if (!occursThisPeriod) continue;
    const alreadyCharged = hasBillingDayOccurred(
      s.billingDay,
      input.periodStart,
      input.today,
    );
    if (alreadyCharged) continue;
    total += monthlySubscriptionAmount(s.amount, s.frequency);
  }

  for (const d of input.debts) {
    if (d.remainingAmount <= 0 || d.monthlyPayment <= 0) continue;
    if (d.paidInPeriod) continue;
    total += Math.min(d.monthlyPayment, d.remainingAmount);
  }

  total += sumUpcomingInstallmentsInPeriod(
    input.installmentPayments ?? [],
    input.periodStart,
    input.periodEnd,
  );

  return round2(total);
}

export function spendableHintFor(
  limitedBy: SpendableLimitedBy,
  upcomingWithdrawals: number,
): string {
  if (limitedBy === "zero") {
    return "Rien de disponible pour les plaisirs ce mois-ci.";
  }
  if (limitedBy === "balance") {
    const z = upcomingWithdrawals.toLocaleString("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return `Limité par ton solde (${z} € de prélèvements à venir)`;
  }
  return "Selon tes enveloppes plaisir";
}

/**
 * Calcule solde, prélèvements à venir et reste à dépenser (plafond compte × enveloppes).
 * C’est la fonction unique testée pour le tableau de bord.
 */
export function calculateSpendableDashboard(
  input: SpendableDashboardInput,
): BudgetSummary {
  const currentBalance = calculateCurrentBalance(
    input.openingBalance,
    input.incomesSinceOpening,
    input.expensesSinceOpening,
  );

  const upcomingWithdrawals = calculateUpcomingWithdrawals({
    today: input.today,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    subscriptions: input.subscriptions,
    debts: input.debts,
    installmentPayments: input.installmentPayments,
  });

  const freeMoney = round2(currentBalance - upcomingWithdrawals);

  const envelopes = buildEnvelopeStatuses(input.envelopes);
  const pleasureEnvelopes = envelopes.filter((e) => e.type === "PLAISIR");
  const pleasureBudgeted = round2(
    pleasureEnvelopes.reduce((sum, e) => sum + e.monthlyAmount, 0),
  );
  const pleasureSpent = round2(
    pleasureEnvelopes.reduce((sum, e) => sum + e.spent, 0),
  );
  const envelopeRemaining = round2(pleasureBudgeted - pleasureSpent);

  const remainingToSpend = round2(
    Math.max(0, Math.min(freeMoney, envelopeRemaining)),
  );

  let spendableLimitedBy: SpendableLimitedBy;
  if (remainingToSpend <= 0) {
    spendableLimitedBy = "zero";
  } else if (freeMoney <= envelopeRemaining) {
    spendableLimitedBy = "balance";
  } else {
    spendableLimitedBy = "envelopes";
  }

  // Compat : charges « brutes » du mois (tous abonnements + dettes) pour messages serrés
  let mandatoryCharges = 0;
  for (const s of input.subscriptions) {
    if (s.status === "ACTIF" || s.status === "A_RESILIER") {
      mandatoryCharges += monthlySubscriptionAmount(s.amount, s.frequency);
    }
  }
  for (const d of input.debts) {
    if (d.remainingAmount > 0 && d.monthlyPayment > 0) {
      mandatoryCharges += Math.min(d.monthlyPayment, d.remainingAmount);
    }
  }
  mandatoryCharges = round2(mandatoryCharges);

  const incomesTotal = round2(input.incomesTotal);
  const available = round2(incomesTotal - mandatoryCharges);
  const isTightMonth = available < 0;
  const allocation = allocateAvailable(available, input.allocation);

  return {
    incomesTotal,
    mandatoryCharges,
    available,
    isTightMonth,
    allocation,
    pleasureBudgeted,
    pleasureSpent,
    remainingToSpend,
    envelopes,
    currentBalance,
    upcomingWithdrawals,
    freeMoney,
    envelopeRemaining,
    spendableLimitedBy,
    spendableHint: spendableHintFor(spendableLimitedBy, upcomingWithdrawals),
  };
}

/** Message si le mois est serré (charges > rentrées). */
export function tightMonthMessage(): string {
  return "Ce mois-ci est serré. Tu peux revoir tes abonnements actifs si besoin.";
}

/** Message si aucune rentrée ce mois-ci. */
export function noIncomeMessage(): string {
  return "Aucune rentrée enregistrée ce mois-ci.";
}
