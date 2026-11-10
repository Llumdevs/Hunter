import { isoWeekday } from "@/lib/time/weekday";
import type { NightStats } from "./stats";
import { WEEKDAY_LABELS } from "./weekdays";

export type NightBar = { nightDate: string; day: string; signupsPct: number; checkinsPct: number };

const FULL = 100;

// Alturas en % respecto al valor más alto de la semana (apuntados o check-ins).
export function nightBars(nights: NightStats[]): NightBar[] {
  const max = Math.max(0, ...nights.flatMap((n) => [n.signups, n.checkins]));
  const pct = (value: number) => (max === 0 ? 0 : (value / max) * FULL);
  return nights.map((n) => ({
    nightDate: n.night_date,
    day: WEEKDAY_LABELS[isoWeekday(n.night_date) - 1],
    signupsPct: pct(n.signups),
    checkinsPct: pct(n.checkins),
  }));
}
