import { NextResponse } from "next/server";
import { __resetRateLimitStoreForTests } from "@/lib/rate-limit";

/**
 * Uniquement pour les tests e2e (ALLOW_SEED=true).
 * Réinitialise le store mémoire du rate-limit login.
 */
export async function POST() {
  // ALLOW_SEED=true uniquement (serveur e2e). Pas de check NODE_ENV :
  // `next start` / standalone tourne en production.
  if (process.env.ALLOW_SEED !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  __resetRateLimitStoreForTests();
  return NextResponse.json({ ok: true });
}
