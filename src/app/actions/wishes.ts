"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUserOrThrow } from "@/lib/session";
import { isWishReady } from "@/lib/budget/wishes";
import { toNumber } from "@/lib/utils";
import { wishDecisionSchema, wishItemSchema } from "@/lib/validations/entities";
import type { ActionResult } from "./expenses";

function revalidate() {
  revalidatePath("/");
  revalidatePath("/coups-de-coeur");
  revalidatePath("/depenses");
  revalidatePath("/bilan");
}

export async function createWishItem(raw: unknown): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const parsed = wishItemSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };

    if (parsed.data.envelopeId) {
      const env = await prisma.envelope.findFirst({
        where: { id: parsed.data.envelopeId, userId: user.id },
      });
      if (!env) return { ok: false, error: "Enveloppe introuvable" };
    }

    const item = await prisma.wishItem.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        price: parsed.data.price,
        link: parsed.data.link,
        photoUrl: parsed.data.photoUrl,
        envelopeId: parsed.data.envelopeId,
      },
    });
    revalidate();
    return { ok: true, id: item.id };
  } catch {
    return { ok: false, error: "Impossible d’ajouter le coup de cœur" };
  }
}

export async function decideWishItem(
  raw: unknown,
): Promise<ActionResult & { saved?: number }> {
  try {
    const user = await getUserOrThrow();
    const parsed = wishDecisionSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };

    const item = await prisma.wishItem.findFirst({
      where: { id: parsed.data.id, userId: user.id, status: "EN_ATTENTE" },
      include: { envelope: true },
    });
    if (!item) return { ok: false, error: "Article introuvable" };

    if (!isWishReady(item.addedAt)) {
      return { ok: false, error: "Les 48 h ne sont pas encore écoulées." };
    }

    if (parsed.data.decision === "ABANDONNE") {
      await prisma.wishItem.update({
        where: { id: item.id },
        data: { status: "ABANDONNE", decidedAt: new Date() },
      });
      revalidate();
      return { ok: true, id: item.id, saved: toNumber(item.price) };
    }

    // ACHETE → créer la dépense
    let envelopeId = item.envelopeId;
    if (!envelopeId) {
      const fallback = await prisma.envelope.findFirst({
        where: { userId: user.id, type: "PLAISIR" },
        orderBy: { sortOrder: "asc" },
      });
      if (!fallback) return { ok: false, error: "Crée une enveloppe avant d’acheter" };
      envelopeId = fallback.id;
    }

    await prisma.$transaction(async (tx) => {
      await tx.wishItem.update({
        where: { id: item.id },
        data: { status: "ACHETE", decidedAt: new Date() },
      });
      await tx.expense.create({
        data: {
          userId: user.id,
          envelopeId: envelopeId!,
          amount: item.price,
          label: item.name,
          date: new Date(),
          wishItemId: item.id,
        },
      });
    });

    revalidate();
    return { ok: true, id: item.id };
  } catch {
    return { ok: false, error: "Impossible d’enregistrer la décision" };
  }
}

export async function deleteWishItem(id: string): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const existing = await prisma.wishItem.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) return { ok: false, error: "Article introuvable" };
    await prisma.wishItem.delete({ where: { id: existing.id } });
    revalidate();
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de supprimer" };
  }
}

export async function getWishSavingsTotal(userId: string): Promise<number> {
  const abandoned = await prisma.wishItem.findMany({
    where: { userId, status: "ABANDONNE" },
    select: { price: true },
  });
  return abandoned.reduce((s, w) => s + toNumber(w.price), 0);
}
