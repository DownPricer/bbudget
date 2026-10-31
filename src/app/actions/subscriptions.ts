"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUserOrThrow } from "@/lib/session";
import { subscriptionSchema, updateSubscriptionSchema } from "@/lib/validations/entities";
import type { ActionResult } from "./expenses";

function revalidate() {
  revalidatePath("/");
  revalidatePath("/abonnements");
  revalidatePath("/plus");
  revalidatePath("/bilan");
}

export async function createSubscription(raw: unknown): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const parsed = subscriptionSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };

    const sub = await prisma.subscription.create({
      data: { userId: user.id, ...parsed.data },
    });
    revalidate();
    return { ok: true, id: sub.id };
  } catch {
    return { ok: false, error: "Impossible d’ajouter l’abonnement" };
  }
}

export async function updateSubscription(raw: unknown): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const parsed = updateSubscriptionSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };

    const existing = await prisma.subscription.findFirst({
      where: { id: parsed.data.id, userId: user.id },
    });
    if (!existing) return { ok: false, error: "Abonnement introuvable" };

    const { id, status, ...rest } = parsed.data;
    await prisma.subscription.update({
      where: { id },
      data: {
        ...rest,
        ...(status
          ? {
              status,
              cancelledAt: status === "RESILIE" ? new Date() : existing.cancelledAt,
            }
          : {}),
      },
    });
    revalidate();
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Impossible de modifier l’abonnement" };
  }
}

export async function setSubscriptionStatus(
  id: string,
  status: "ACTIF" | "A_RESILIER" | "RESILIE",
): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const existing = await prisma.subscription.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) return { ok: false, error: "Abonnement introuvable" };

    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status,
        cancelledAt: status === "RESILIE" ? new Date() : null,
      },
    });
    revalidate();
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Impossible de mettre à jour le statut" };
  }
}

export async function deleteSubscription(id: string): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const existing = await prisma.subscription.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) return { ok: false, error: "Abonnement introuvable" };
    await prisma.subscription.delete({ where: { id: existing.id } });
    revalidate();
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de supprimer" };
  }
}
