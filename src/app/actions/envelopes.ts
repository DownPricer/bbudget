"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUserOrThrow } from "@/lib/session";
import {
  createEnvelopeSchema,
  updateEnvelopeSchema,
} from "@/lib/validations/budget";
import type { ActionResult } from "./expenses";

export async function createEnvelope(raw: unknown): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const parsed = createEnvelopeSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
    }

    const maxOrder = await prisma.envelope.aggregate({
      where: { userId: user.id },
      _max: { sortOrder: true },
    });

    const envelope = await prisma.envelope.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        emoji: parsed.data.emoji,
        color: parsed.data.color,
        monthlyAmount: parsed.data.monthlyAmount,
        type: parsed.data.type,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });

    revalidatePath("/");
    revalidatePath("/enveloppes");
    revalidatePath("/depenses");
    return { ok: true, id: envelope.id };
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return { ok: false, error: "Session expirée" };
    }
    return { ok: false, error: "Impossible de créer l’enveloppe" };
  }
}

export async function updateEnvelope(raw: unknown): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const parsed = updateEnvelopeSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
    }

    const existing = await prisma.envelope.findFirst({
      where: { id: parsed.data.id, userId: user.id },
      select: { id: true },
    });
    if (!existing) return { ok: false, error: "Enveloppe introuvable" };

    await prisma.envelope.update({
      where: { id: existing.id },
      data: {
        name: parsed.data.name,
        emoji: parsed.data.emoji,
        color: parsed.data.color,
        monthlyAmount: parsed.data.monthlyAmount,
        type: parsed.data.type,
      },
    });

    revalidatePath("/");
    revalidatePath("/enveloppes");
    return { ok: true, id: existing.id };
  } catch {
    return { ok: false, error: "Impossible de modifier l’enveloppe" };
  }
}

export async function deleteEnvelope(id: string): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const existing = await prisma.envelope.findFirst({
      where: { id, userId: user.id },
      select: { id: true, _count: { select: { expenses: true } } },
    });
    if (!existing) return { ok: false, error: "Enveloppe introuvable" };
    if (existing._count.expenses > 0) {
      return {
        ok: false,
        error: "Cette enveloppe a des dépenses. Supprime-les ou déplace-les d’abord.",
      };
    }

    await prisma.envelope.delete({ where: { id: existing.id } });

    revalidatePath("/");
    revalidatePath("/enveloppes");
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de supprimer l’enveloppe" };
  }
}
