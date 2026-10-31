/**
 * Calcule la période du mois budgétaire à partir d'une date de référence
 * et du jour de début configuré (1–28).
 */
export type BudgetPeriod = {
  start: Date;
  end: Date;
  label: string;
};

function clampDay(day: number): number {
  return Math.min(28, Math.max(1, Math.floor(day)));
}

export function getBudgetPeriod(
  referenceDate: Date,
  budgetMonthStartDay = 1,
): BudgetPeriod {
  const startDay = clampDay(budgetMonthStartDay);
  const y = referenceDate.getFullYear();
  const m = referenceDate.getMonth();
  const d = referenceDate.getDate();

  let start: Date;
  if (d >= startDay) {
    start = new Date(y, m, startDay, 0, 0, 0, 0);
  } else {
    start = new Date(y, m - 1, startDay, 0, 0, 0, 0);
  }

  const end = new Date(
    start.getFullYear(),
    start.getMonth() + 1,
    startDay,
    0,
    0,
    0,
    0,
  );
  // Fin exclusive : veille du prochain début, 23:59:59.999
  end.setMilliseconds(-1);

  const label = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(start);

  return { start, end, label };
}

/** Vérifie si une date tombe dans [start, end] inclus. */
export function isInPeriod(date: Date, period: BudgetPeriod): boolean {
  const t = date.getTime();
  return t >= period.start.getTime() && t <= period.end.getTime();
}
