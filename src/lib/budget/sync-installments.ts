import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import {
  installmentExpenseLabel,
  selectDueInstallments,
} from "./installments";

/**
 * Crée les dépenses des échéances dues (idempotent, sans doublon).
 * À appeler au chargement serveur (pas de cron).
 */
export async function syncDueInstallmentExpenses(
  userId: string,
  today = new Date(),
): Promise<number> {
  const due = await prisma.installmentPayment.findMany({
    where: {
      status: "A_VENIR",
      skipExpense: false,
      expenseId: null,
      dueDate: { lte: today },
      plan: { userId, status: "EN_COURS" },
    },
    include: {
      plan: { select: { name: true, envelopeId: true, installmentCount: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  const toProcess = selectDueInstallments(due, today);
  let created = 0;

  for (const payment of toProcess) {
    await prisma.$transaction(async (tx) => {
      const fresh = await tx.installmentPayment.findFirst({
        where: {
          id: payment.id,
          status: "A_VENIR",
          expenseId: null,
        },
      });
      if (!fresh) return;

      const expense = await tx.expense.create({
        data: {
          userId,
          envelopeId: payment.plan.envelopeId,
          amount: payment.amount,
          label: installmentExpenseLabel(
            payment.index,
            payment.plan.installmentCount,
            payment.plan.name,
          ),
          date: payment.dueDate,
          note: "Paiement en plusieurs fois",
        },
      });

      await tx.installmentPayment.update({
        where: { id: payment.id },
        data: { status: "PAYEE", expenseId: expense.id },
      });

      const remaining = await tx.installmentPayment.count({
        where: { planId: payment.planId, status: "A_VENIR" },
      });
      if (remaining === 0) {
        await tx.installmentPlan.update({
          where: { id: payment.planId },
          data: { status: "TERMINE" },
        });
      }
      created += 1;
    });
  }

  return created;
}

export async function listActiveInstallmentCharges(userId: string) {
  const payments = await prisma.installmentPayment.findMany({
    where: {
      status: "A_VENIR",
      plan: { userId, status: "EN_COURS" },
    },
    select: { amount: true, dueDate: true, status: true },
  });
  return payments.map((p) => ({
    status: p.status,
    amount: toNumber(p.amount),
    dueDate: p.dueDate,
  }));
}
