type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

const DEFAULT_LIMIT = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

export type RateLimitStatus = {
  blocked: boolean;
  count: number;
  remaining: number;
  resetAt: number;
  /** Minutes restantes avant déblocage (au moins 1 si bloqué). */
  minutesRemaining: number;
};

function minutesUntil(resetAt: number, now = Date.now()): number {
  return Math.max(1, Math.ceil((resetAt - now) / 60_000));
}

/**
 * Statut du rate-limit sans incrémenter.
 * Compteur = échecs uniquement (voir recordLoginFailure / clearLoginFailures).
 */
export function getLoginRateLimitStatus(
  key: string,
  limit = DEFAULT_LIMIT,
): RateLimitStatus {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    return {
      blocked: false,
      count: 0,
      remaining: limit,
      resetAt: now + DEFAULT_WINDOW_MS,
      minutesRemaining: 0,
    };
  }

  const blocked = entry.count >= limit;
  return {
    blocked,
    count: entry.count,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
    minutesRemaining: blocked ? minutesUntil(entry.resetAt, now) : 0,
  };
}

/** Incrémente le compteur d’échecs. Retourne le statut après incrément. */
export function recordLoginFailure(
  key: string,
  limit = DEFAULT_LIMIT,
  windowMs = DEFAULT_WINDOW_MS,
): RateLimitStatus {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      blocked: 1 >= limit,
      count: 1,
      remaining: Math.max(0, limit - 1),
      resetAt,
      minutesRemaining: 1 >= limit ? minutesUntil(resetAt, now) : 0,
    };
  }

  entry.count += 1;
  store.set(key, entry);
  const blocked = entry.count >= limit;
  return {
    blocked,
    count: entry.count,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
    minutesRemaining: blocked ? minutesUntil(entry.resetAt, now) : 0,
  };
}

/** Remet le compteur à zéro (connexion réussie). */
export function clearLoginFailures(key: string): void {
  store.delete(key);
}

/** @deprecated Préférer getLoginRateLimitStatus / recordLoginFailure / clearLoginFailures */
export function rateLimit(
  key: string,
  limit = DEFAULT_LIMIT,
  windowMs = DEFAULT_WINDOW_MS,
): { success: boolean; remaining: number; resetAt: number } {
  const status = getLoginRateLimitStatus(key, limit);
  if (status.blocked) {
    return { success: false, remaining: 0, resetAt: status.resetAt };
  }
  const after = recordLoginFailure(key, limit, windowMs);
  return {
    success: !after.blocked || after.count < limit,
    remaining: after.remaining,
    resetAt: after.resetAt,
  };
}

/** Nettoyage ponctuel des entrées expirées */
export function pruneRateLimits() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

/** Test-only : vide le store */
export function __resetRateLimitStoreForTests() {
  store.clear();
}
