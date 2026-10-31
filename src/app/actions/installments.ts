"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUserOrThrow } from "@/lib/session";
import {
  calculateInstallmentEndDate,
  generateInstallmentSchedule,
} from "@/lib/budget/installments";
import {
  createInstallmentPlanSchema,
  updateInstallmentPlanSchema,
} from "@/lib/validations/installments";
import type { ActionResult } from "./expenses";

function revalidate() {
  revalidatePath("/");
  revalidatePath("/abonnements");
  revalidatePath("/depenses");
  revalidatePath("/enveloppes");
  revalidatePath("/coups-de-coeur");
  revalidatePath("/bilan");
}

async function assertEnvelope(userId: string, envelopeId: string) {
  const env = await prisma.envelope.findFirst({
    where: { id: envelopeId, userId },
    select: { id: true },
  });
  if (!env) throw new Error("ENVELOPE_NOT_FOUND");
}

export async function createInstallmentPlan(raw: unknown): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const parsed = createInstallmentPlanSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
    }
    const data = parsed.data;
    await assertEnvelope(user.id, data.envelopeId);

    if (data.wishItemId) {
      const wish = await prisma.wishItem.findFirst({
        where: { id: data.wishItemId, userId: user.id, status: "EN_ATTENTE" },
      });
      if (!wish) return { ok: false, error: "Coup de cœur introuvable" };
    }

    const schedule = generateInstallmentSchedule({
      totalAmount: data.totalAmount,
      installmentCount: data.installmentCount,
      firstDueDate: data.firstDueDate,
      frequency: data.frequency,
      firstAmount: data.firstAmount,
    });
    const already = new Set(data.alreadyPaidIndexes ?? []);
    const regularAmount = schedule[1]?.amount ?? schedule[0].amount;
    const firstAmount = schedule[0].amount;
    const endDate = calculateInstallmentEndDate(
      data.firstDueDate,
      data.installmentCount,
      data.frequency,
    );

    const plan = await prisma.$transaction(async (tx) => {
      if (data.wishItemId) {
        await tx.wishItem.update({
          where: { id: data.wishItemId },
          data: { status: "ACHETE", decidedAt: new Date() },
        });
      }

      const created = await tx.installmentPlan.create({
        data: {
          userId: user.id,
          name: data.name,
          provider: data.provider,
          providerLabel: data.provider === "AUTRE" ? data.providerLabel : null,
          envelopeId: data.envelopeId,
          totalAmount: data.totalAmount,
          installmentCount: data.installmentCount,
          regularAmount,
          firstAmount,
          firstDueDate: data.firstDueDate,
          frequency: data.frequency,
          endDate,
          status: "EN_COURS",
          wishItemId: data.wishItemId,
          payments: {
            create: schedule.map((s) => {
              const paidAlready = already.has(s.index);
              return {
                index: s.index,
                amount: s.amount,
                dueDate: s.dueDate,
                status: paidAlready ? "PAYEE" : "A_VENIR",
                skipExpense: paidAlready,
              };
            }),
          },
        },
      });

      const unpaid = schedule.filter((s) => !already.has(s.index));
      if (unpaid.length === 0) {
        await tx.installmentPlan.update({
          where: { id: created.id },
          data: { status: "TERMINE" },
        });
      }
      return created;
    });

    revalidate();
    return { ok: true, id: plan.id };
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return { ok: false, error: "Session expirée" };
    }
    if (e instanceof Error && e.message === "ENVELOPE_NOT_FOUND") {
      return { ok: false, error: "Enveloppe introuvable" };
    }
    return { ok: false, error: "Impossible de créer le plan" };
  }
}

export async function updateInstallmentPlan(raw: unknown): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const parsed = updateInstallmentPlanSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
    }
    const data = parsed.data;

    const existing = await prisma.installmentPlan.findFirst({
      where: { id: data.id, userId: user.id },
      include: { payments: true },
    });
    if (!existing) return { ok: false, error: "Plan introuvable" };
    if (existing.status === "ANNULE") {
      return { ok: false, error: "Ce plan est annulé" };
    }

    await assertEnvelope(user.id, data.envelopeId);

    const schedule = generateInstallmentSchedule({
      totalAmount: data.totalAmount,
      installmentCount: data.installmentCount,
      firstDueDate: data.firstDueDate,
      frequency: data.frequency,
      firstAmount: data.firstAmount,
    });
    const paid = existing.payments.filter((p) => p.status === "PAYEE");
    if (schedule.length < paid.length) {
      return {
        ok: false,
        error: `Il y a déjà ${paid.length} échéance(s) payée(s) — impossible de réduire en dessous.`,
      };
    }

    const regularAmount = schedule[1]?.amount ?? schedule[0].amount;
    const firstAmount = schedule[0].amount;
    const endDate = calculateInstallmentEndDate(
      data.firstDueDate,
      data.installmentCount,
      data.frequency,
    );

    await prisma.$transaction(async (tx) => {
      await tx.installmentPayment.deleteMany({
        where: { planId: existing.id, status: "A_VENIR" },
      });

      const paidIndexes = new Set(paid.map((p) => p.index));
      const toCreate = schedule.filter((s) => !paidIndexes.has(s.index));

      if (toCreate.length > 0) {
        await tx.installmentPayment.createMany({
          data: toCreate.map((s) => ({
            planId: existing.id,
            index: s.index,
            amount: s.amount,
            dueDate: s.dueDate,
            status: "A_VENIR" as const,
            skipExpense: false,
          })),
        });
      }

      // Mettre à jour les montants/dates des échéances encore A_VENIR si index overlap...
      // (déjà régénérées). Mettre à jour le plan.
      await tx.installmentPlan.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          provider: data.provider,
          providerLabel: data.provider === "AUTRE" ? data.providerLabel : null,
          envelopeId: data.envelopeId,
          totalAmount: data.totalAmount,
          installmentCount: data.installmentCount,
          regularAmount,
          firstAmount,
          firstDueDate: data.firstDueDate,
          frequency: data.frequency,
          endDate,
          status: toCreate.length === 0 ? "TERMINE" : "EN_COURS",
        },
      });
    });

    revalidate();
    return { ok: true, id: existing.id };
  } catch {
    return { ok: false, error: "Impossible de modifier le plan" };
  }
}

export async function cancelInstallmentPlan(id: string): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const existing = await prisma.installmentPlan.findFirst({
      where: { id, userId: user.id },
      select: { id: true, status: true },
    });
    if (!existing) return { ok: false, error: "Plan introuvable" };

    await prisma.$transaction(async (tx) => {
      await tx.installmentPayment.deleteMany({
        where: { planId: existing.id, status: "A_VENIR" },
      });
      await tx.installmentPlan.update({
        where: { id: existing.id },
        data: { status: "ANNULE" },
      });
    });

    revalidate();
    return { ok: true, id: existing.id };
  } catch {
    return { ok: false, error: "Impossible d’annuler le plan" };
  }
}
