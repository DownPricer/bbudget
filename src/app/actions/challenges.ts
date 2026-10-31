"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUserOrThrow } from "@/lib/session";
import { challengeStartSchema } from "@/lib/validations/entities";
import type { ActionResult } from "./expenses";

function revalidate() {
  revalidatePath("/astuces");
  revalidatePath("/plus");
}

export async function startChallenge(raw: unknown): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const parsed = challengeStartSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };

    const challenge = await prisma.challenge.create({
      data: {
        userId: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        durationDays: parsed.data.durationDays,
        startedAt: new Date(),
        status: "ACTIF",
        progressDays: 0,
      },
    });
    revalidate();
    return { ok: true, id: challenge.id };
  } catch {
    return { ok: false, error: "Impossible de lancer le défi" };
  }
}

export async function markChallengeDay(id: string): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const challenge = await prisma.challenge.findFirst({
      where: { id, userId: user.id, status: "ACTIF" },
    });
    if (!challenge) return { ok: false, error: "Défi introuvable" };

    const next = challenge.progressDays + 1;
    const done = next >= challenge.durationDays;

    await prisma.challenge.update({
      where: { id: challenge.id },
      data: {
        progressDays: next,
        ...(done
          ? { status: "TERMINE", completedAt: new Date() }
          : {}),
      },
    });
    revalidate();
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Impossible de mettre à jour le défi" };
  }
}

export async function abandonChallenge(id: string): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const challenge = await prisma.challenge.findFirst({
      where: { id, userId: user.id, status: "ACTIF" },
    });
    if (!challenge) return { ok: false, error: "Défi introuvable" };

    await prisma.challenge.update({
      where: { id: challenge.id },
      data: { status: "ABANDONNE" },
    });
    revalidate();
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible d’abandonner" };
  }
}
