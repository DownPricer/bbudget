"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUserOrThrow } from "@/lib/session";
import {
  createExpenseSchema,
  updateExpenseSchema,
} from "@/lib/validations/budget";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function assertEnvelopeOwned(userId: string, envelopeId: string) {
  const envelope = await prisma.envelope.findFirst({
    where: { id: envelopeId, userId },
    select: { id: true },
  });
  if (!envelope) throw new Error("ENVELOPE_NOT_FOUND");
}

export async function createExpense(raw: unknown): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const parsed = createExpenseSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
    }

    await assertEnvelopeOwned(user.id, parsed.data.envelopeId);

    const expense = await prisma.expense.create({
      data: {
        userId: user.id,
        amount: parsed.data.amount,
        envelopeId: parsed.data.envelopeId,
        label: parsed.data.label ?? "Dépense",
        date: parsed.data.date ?? new Date(),
        note: parsed.data.note,
      },
    });

    revalidatePath("/");
    revalidatePath("/depenses");
    revalidatePath("/enveloppes");
    return { ok: true, id: expense.id };
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return { ok: false, error: "Session expirée" };
    }
    return { ok: false, error: "Impossible d’enregistrer la dépense" };
  }
}

export async function updateExpense(raw: unknown): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const parsed = updateExpenseSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
    }

    const existing = await prisma.expense.findFirst({
      where: { id: parsed.data.id, userId: user.id },
      select: { id: true },
    });
    if (!existing) return { ok: false, error: "Dépense introuvable" };

    await assertEnvelopeOwned(user.id, parsed.data.envelopeId);

    await prisma.expense.update({
      where: { id: existing.id },
      data: {
        amount: parsed.data.amount,
        envelopeId: parsed.data.envelopeId,
        label: parsed.data.label ?? "Dépense",
        date: parsed.data.date ?? new Date(),
        note: parsed.data.note,
      },
    });

    revalidatePath("/");
    revalidatePath("/depenses");
    revalidatePath("/enveloppes");
    return { ok: true, id: existing.id };
  } catch {
    return { ok: false, error: "Impossible de modifier la dépense" };
  }
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const existing = await prisma.expense.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) return { ok: false, error: "Dépense introuvable" };

    await prisma.expense.delete({ where: { id: existing.id } });

    revalidatePath("/");
    revalidatePath("/depenses");
    revalidatePath("/enveloppes");
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de supprimer la dépense" };
  }
}
