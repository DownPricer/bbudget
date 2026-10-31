"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUserOrThrow } from "@/lib/session";
import { balanceAmountSchema } from "@/lib/validations/money";
import type { ActionResult } from "./expenses";

/**
 * Ajuste le solde affiché : met à jour solde de départ + date de référence
 * sans modifier l’historique des mouvements.
 */
export async function adjustAccountBalance(raw: unknown): Promise<ActionResult> {
  try {
    const user = await getUserOrThrow();
    const parsed = balanceAmountSchema.safeParse(
      typeof raw === "object" && raw && "amount" in raw
        ? (raw as { amount: unknown }).amount
        : raw,
    );
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Solde invalide" };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        openingBalance: parsed.data,
        openingBalanceAt: new Date(),
      },
    });

    revalidatePath("/");
    revalidatePath("/reglages");
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return { ok: false, error: "Session expirée" };
    }
    return { ok: false, error: "Impossible de mettre à jour le solde" };
  }
}
