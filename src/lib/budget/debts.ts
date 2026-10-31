export type DebtLike = {
  id: string;
  creditor: string;
  remainingAmount: number;
  initialAmount: number;
  monthlyPayment: number | null;
};

/** Méthode boule de neige : plus petite dette restante en premier. */
export function sortSnowball<T extends DebtLike>(debts: T[]): T[] {
  return [...debts]
    .filter((d) => d.remainingAmount > 0)
    .sort((a, b) => a.remainingAmount - b.remainingAmount);
}

export function estimatePayoffDate(
  remaining: number,
  monthlyPayment: number | null,
  from = new Date(),
): Date | null {
  if (!monthlyPayment || monthlyPayment <= 0 || remaining <= 0) return null;
  const months = Math.ceil(remaining / monthlyPayment);
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function debtProgress(initial: number, remaining: number): number {
  if (initial <= 0) return remaining <= 0 ? 1 : 0;
  return Math.min(1, Math.max(0, 1 - remaining / initial));
}
