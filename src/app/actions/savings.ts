"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUserOrThrow } from "@/lib/session";
import { toNumber } from "@/lib/utils";
import {
  savingsDepositSchema,
  savingsGoalSchema,
  updateSavingsGoalSchema,
} from "@/lib/validations/entities";
import type { ActionResult } from "./expenses";

function revalidate() {
  revalidatePath("/");
  revalidatePath("/dettes-epargne");
  revalidatePath("/bilan");
}

export async function createSavingsGoal(raw: unknown): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const parsed = savingsGoalSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };

    const goal = await prisma.savingsGoal.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        emoji: parsed.data.emoji,
        targetAmount: parsed.data.targetAmount,
        targetDate: parsed.data.targetDate ?? null,
      },
    });
    revalidate();
    return { ok: true, id: goal.id };
  } catch {
    return { ok: false, error: "Impossible de créer l’objectif" };
  }
}

export async function updateSavingsGoal(raw: unknown): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const parsed = updateSavingsGoalSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };

    const existing = await prisma.savingsGoal.findFirst({
      where: { id: parsed.data.id, userId: user.id },
    });
    if (!existing) return { ok: false, error: "Objectif introuvable" };

    await prisma.savingsGoal.update({
      where: { id: existing.id },
      data: {
        name: parsed.data.name,
        emoji: parsed.data.emoji,
        targetAmount: parsed.data.targetAmount,
        targetDate: parsed.data.targetDate ?? null,
      },
    });
    revalidate();
    return { ok: true, id: existing.id };
  } catch {
    return { ok: false, error: "Impossible de modifier" };
  }
}

export async function addSavingsDeposit(
  raw: unknown,
): Promise<ActionResult & { completed?: boolean }> {
  try {
    const user = await getUserOrThrow();
    const parsed = savingsDepositSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };

    const goal = await prisma.savingsGoal.findFirst({
      where: { id: parsed.data.goalId, userId: user.id },
    });
    if (!goal) return { ok: false, error: "Objectif introuvable" };

    const next = Math.round((toNumber(goal.currentAmount) + parsed.data.amount) * 100) / 100;
    const target = toNumber(goal.targetAmount);

    await prisma.$transaction([
      prisma.savingsDeposit.create({
        data: {
          goalId: goal.id,
          amount: parsed.data.amount,
          date: parsed.data.date ?? new Date(),
        },
      }),
      prisma.savingsGoal.update({
        where: { id: goal.id },
        data: { currentAmount: next },
      }),
    ]);

    revalidate();
    return { ok: true, id: goal.id, completed: next >= target };
  } catch {
    return { ok: false, error: "Impossible d’enregistrer le versement" };
  }
}

export async function deleteSavingsGoal(id: string): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const existing = await prisma.savingsGoal.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) return { ok: false, error: "Objectif introuvable" };
    await prisma.savingsGoal.delete({ where: { id: existing.id } });
    revalidate();
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de supprimer" };
  }
}
