/**
 * Paiements en plusieurs fois — logique pure (génération, dates, sync).
 */

export type InstallmentFrequency = "MENSUELLE" | "BI_HEBDOMADAIRE" | "HEBDOMADAIRE";

export type GeneratedInstallment = {
  index: number;
  amount: number;
  dueDate: Date;
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Répartit un total en N échéances (centimes exacts).
 * Si firstAmount est fourni et différent, les N-1 suivantes se partagent le reste
 * (le reliquat d’arrondi va sur la dernière).
 * Sinon toutes égales sauf la dernière qui absorbe le reste.
 */
export function splitInstallmentAmounts(
  totalAmount: number,
  count: number,
  firstAmount?: number | null,
): number[] {
  if (count < 2) throw new Error("Au moins 2 échéances");
  const total = round2(totalAmount);
  if (total <= 0) throw new Error("Montant invalide");

  if (firstAmount != null && Number.isFinite(firstAmount) && firstAmount > 0) {
    const first = round2(firstAmount);
    if (first >= total) throw new Error("La 1ʳᵉ échéance doit être inférieure au total");
    const rest = round2(total - first);
    const remainingCount = count - 1;
    const regular = Math.floor((rest * 100) / remainingCount) / 100;
    const amounts = [first];
    let allocated = first;
    for (let i = 1; i < count - 1; i++) {
      amounts.push(regular);
      allocated = round2(allocated + regular);
    }
    amounts.push(round2(total - allocated));
    return amounts;
  }

  const regular = Math.floor((total * 100) / count) / 100;
  const amounts: number[] = [];
  let allocated = 0;
  for (let i = 0; i < count - 1; i++) {
    amounts.push(regular);
    allocated = round2(allocated + regular);
  }
  amounts.push(round2(total - allocated));
  return amounts;
}

export function addInstallmentInterval(
  date: Date,
  frequency: InstallmentFrequency,
  steps = 1,
): Date {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  if (frequency === "MENSUELLE") {
    d.setMonth(d.getMonth() + steps);
  } else if (frequency === "BI_HEBDOMADAIRE") {
    d.setDate(d.getDate() + 14 * steps);
  } else {
    d.setDate(d.getDate() + 7 * steps);
  }
  return d;
}

export function calculateInstallmentEndDate(
  firstDueDate: Date,
  count: number,
  frequency: InstallmentFrequency,
): Date {
  return addInstallmentInterval(firstDueDate, frequency, count - 1);
}

export function generateInstallmentSchedule(input: {
  totalAmount: number;
  installmentCount: number;
  firstDueDate: Date;
  frequency: InstallmentFrequency;
  firstAmount?: number | null;
}): GeneratedInstallment[] {
  const amounts = splitInstallmentAmounts(
    input.totalAmount,
    input.installmentCount,
    input.firstAmount,
  );
  return amounts.map((amount, i) => ({
    index: i + 1,
    amount,
    dueDate: addInstallmentInterval(input.firstDueDate, input.frequency, i),
  }));
}

export function installmentExpenseLabel(
  index: number,
  count: number,
  purchaseName: string,
): string {
  return `Échéance ${index}/${count} – ${purchaseName}`;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Échéances dues (date prévue ≤ aujourd’hui) encore A_VENIR → à payer / créer dépense. */
export function selectDueInstallments<
  T extends { status: string; dueDate: Date; skipExpense?: boolean; expenseId?: string | null },
>(payments: T[], today: Date): T[] {
  const todayEnd = endOfDay(today);
  return payments.filter(
    (p) =>
      p.status === "A_VENIR" &&
      !p.skipExpense &&
      !p.expenseId &&
      p.dueDate.getTime() <= todayEnd.getTime(),
  );
}

/**
 * Somme des échéances A_VENIR dont la date tombe dans la période budgétaire
 * (après sync : les dues sont déjà PAYEE).
 */
export function sumUpcomingInstallmentsInPeriod(
  payments: { status: string; amount: number; dueDate: Date }[],
  periodStart: Date,
  periodEnd: Date,
): number {
  let total = 0;
  for (const p of payments) {
    if (p.status !== "A_VENIR") continue;
    const t = p.dueDate.getTime();
    if (t >= periodStart.getTime() && t <= periodEnd.getTime()) {
      total += p.amount;
    }
  }
  return round2(total);
}

export function summarizePlan(payments: { status: string; amount: number; dueDate: Date }[]) {
  const paid = payments.filter((p) => p.status === "PAYEE");
  const upcoming = payments
    .filter((p) => p.status === "A_VENIR")
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  const remaining = round2(upcoming.reduce((s, p) => s + p.amount, 0));
  return {
    paidCount: paid.length,
    totalCount: payments.length,
    remainingToPay: remaining,
    nextDue: upcoming[0] ?? null,
  };
}
