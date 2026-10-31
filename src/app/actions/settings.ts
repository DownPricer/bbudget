"use server";

import { revalidatePath } from "next/cache";
import { hash, compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getUserOrThrow } from "@/lib/session";
import { changePasswordSchema, settingsSchema } from "@/lib/validations/entities";
import type { ActionResult } from "./expenses";

export async function updateSettings(raw: unknown): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const parsed = settingsSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: parsed.data,
    });

    revalidatePath("/");
    revalidatePath("/reglages");
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible d’enregistrer les réglages" };
  }
}

export async function changePassword(raw: unknown): Promise<ActionResult> {
  try {
    const sessionUser = await getUserOrThrow();
    const parsed = changePasswordSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Mot de passe invalide" };
    }

    const user = await prisma.user.findFirst({
      where: { id: sessionUser.id },
      select: { passwordHash: true },
    });
    if (!user) return { ok: false, error: "Session expirée" };

    const ok = await compare(parsed.data.currentPassword, user.passwordHash);
    if (!ok) return { ok: false, error: "Mot de passe actuel incorrect" };

    const passwordHash = await hash(parsed.data.newPassword, 12);
    await prisma.user.update({
      where: { id: sessionUser.id },
      data: { passwordHash },
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de changer le mot de passe" };
  }
}
