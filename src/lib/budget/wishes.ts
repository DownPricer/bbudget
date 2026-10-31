const WAIT_MS = 48 * 60 * 60 * 1000;

export function wishReadyAt(addedAt: Date): Date {
  return new Date(addedAt.getTime() + WAIT_MS);
}

export function isWishReady(addedAt: Date, now = new Date()): boolean {
  return now.getTime() >= wishReadyAt(addedAt).getTime();
}

export function wishCountdownMs(addedAt: Date, now = new Date()): number {
  return Math.max(0, wishReadyAt(addedAt).getTime() - now.getTime());
}

export function formatCountdown(ms: number): string {
  const totalMin = Math.ceil(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m} min`;
  return `${h} h ${m.toString().padStart(2, "0")}`;
}
