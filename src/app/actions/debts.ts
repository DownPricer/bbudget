"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUserOrThrow } from "@/lib/session";
import { toNumber } from "@/lib/utils";
import { debtPaymentSchema, debtSchema, updateDebtSchema } from "@/lib/validations/entities";
import type { ActionResult } from "./expenses";

function revalidate() {
  revalidatePath("/");
  revalidatePath("/dettes-epargne");
  revalidatePath("/bilan");
}

export async function createDebt(raw: unknown): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const parsed = debtSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };

    const remaining = parsed.data.remainingAmount ?? parsed.data.initialAmount;
    const debt = await prisma.debt.create({
      data: {
        userId: user.id,
        creditor: parsed.data.creditor,
        initialAmount: parsed.data.initialAmount,
        remainingAmount: remaining,
        monthlyPayment: parsed.data.monthlyPayment,
        dueDate: parsed.data.dueDate ?? null,
        note: parsed.data.note,
      },
    });
    revalidate();
    return { ok: true, id: debt.id };
  } catch {
    return { ok: false, error: "Impossible d’ajouter la dette" };
  }
}

export async function updateDebt(raw: unknown): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const parsed = updateDebtSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };

    const existing = await prisma.debt.findFirst({
      where: { id: parsed.data.id, userId: user.id },
    });
    if (!existing) return { ok: false, error: "Dette introuvable" };

    await prisma.debt.update({
      where: { id: existing.id },
      data: {
        creditor: parsed.data.creditor,
        initialAmount: parsed.data.initialAmount,
        remainingAmount: parsed.data.remainingAmount ?? parsed.data.initialAmount,
        monthlyPayment: parsed.data.monthlyPayment,
        dueDate: parsed.data.dueDate ?? null,
        note: parsed.data.note,
      },
    });
    revalidate();
    return { ok: true, id: existing.id };
  } catch {
    return { ok: false, error: "Impossible de modifier la dette" };
  }
}

export async function addDebtPayment(raw: unknown): Promise<ActionResult & { cleared?: boolean }> {
  try {
    const user = await getUserOrThrow();
    const parsed = debtPaymentSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };

    const debt = await prisma.debt.findFirst({
      where: { id: parsed.data.debtId, userId: user.id },
    });
    if (!debt) return { ok: false, error: "Dette introuvable" };

    const pay = parsed.data.amount;
    const remaining = Math.max(0, Math.round((toNumber(debt.remainingAmount) - pay) * 100) / 100);

    await prisma.$transaction([
      prisma.debtPayment.create({
        data: {
          debtId: debt.id,
          amount: pay,
          date: parsed.data.date ?? new Date(),
        },
      }),
      prisma.debt.update({
        where: { id: debt.id },
        data: { remainingAmount: remaining },
      }),
    ]);

    revalidate();
    return { ok: true, id: debt.id, cleared: remaining === 0 };
  } catch {
    return { ok: false, error: "Impossible d’enregistrer le paiement" };
  }
}

export async function deleteDebt(id: string): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const existing = await prisma.debt.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) return { ok: false, error: "Dette introuvable" };
    await prisma.debt.delete({ where: { id: existing.id } });
    revalidate();
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de supprimer" };
  }
}
