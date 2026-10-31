"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUserOrThrow } from "@/lib/session";
import {
  createIncomeSchema,
  updateIncomeSchema,
} from "@/lib/validations/budget";
import type { ActionResult } from "./expenses";

export async function createIncome(raw: unknown): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const parsed = createIncomeSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
    }

    const income = await prisma.income.create({
      data: {
        userId: user.id,
        amount: parsed.data.amount,
        label: parsed.data.label,
        type: parsed.data.type,
        date: parsed.data.date ?? new Date(),
        recurring: parsed.data.recurring ?? false,
        months: parsed.data.months ?? [],
      },
    });

    revalidatePath("/");
    revalidatePath("/rentrees");
    return { ok: true, id: income.id };
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return { ok: false, error: "Session expirée" };
    }
    return { ok: false, error: "Impossible d’enregistrer la rentrée" };
  }
}

export async function updateIncome(raw: unknown): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const parsed = updateIncomeSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
    }

    const existing = await prisma.income.findFirst({
      where: { id: parsed.data.id, userId: user.id },
      select: { id: true },
    });
    if (!existing) return { ok: false, error: "Rentrée introuvable" };

    await prisma.income.update({
      where: { id: existing.id },
      data: {
        amount: parsed.data.amount,
        label: parsed.data.label,
        type: parsed.data.type,
        date: parsed.data.date ?? new Date(),
        recurring: parsed.data.recurring ?? false,
        months: parsed.data.months ?? [],
      },
    });

    revalidatePath("/");
    revalidatePath("/rentrees");
    return { ok: true, id: existing.id };
  } catch {
    return { ok: false, error: "Impossible de modifier la rentrée" };
  }
}

export async function deleteIncome(id: string): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const existing = await prisma.income.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) return { ok: false, error: "Rentrée introuvable" };

    await prisma.income.delete({ where: { id: existing.id } });

    revalidatePath("/");
    revalidatePath("/rentrees");
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de supprimer la rentrée" };
  }
}
