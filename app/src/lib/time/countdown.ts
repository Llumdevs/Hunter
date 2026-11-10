export type Remaining = { kind: "active"; minutes: number; seconds: number } | { kind: "expired" };

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

export function remainingTime(expiresAt: Date, now: Date): Remaining {
  const totalSeconds = Math.ceil((expiresAt.getTime() - now.getTime()) / MS_PER_SECOND);
  if (totalSeconds <= 0) return { kind: "expired" };
  return {
    kind: "active",
    minutes: Math.floor(totalSeconds / SECONDS_PER_MINUTE),
    seconds: totalSeconds % SECONDS_PER_MINUTE,
  };
}

export function formatLocalClock(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).format(date);
}
