export type NightStats = { night_date: string; signups: number; checkins: number; redemptions: number; billable: number };
export type StatsSummary = Omit<NightStats, "night_date"> & { checkinRate: number | null };

const MS_PER_DAY = 86_400_000;

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export function lastNights(lastNight: string, count: number): { from: string; to: string } {
  const to = new Date(`${lastNight}T00:00:00Z`);
  return { from: isoDate(new Date(to.getTime() - (count - 1) * MS_PER_DAY)), to: lastNight };
}

// checkinRate es null cuando no hay apuntados: no hay tasa que calcular.
export function summarizeNights(nights: NightStats[]): StatsSummary {
  const total = (pick: (night: NightStats) => number) => nights.reduce((sum, night) => sum + pick(night), 0);
  const signups = total((n) => n.signups);
  const checkins = total((n) => n.checkins);
  return {
    signups,
    checkins,
    redemptions: total((n) => n.redemptions),
    billable: total((n) => n.billable),
    checkinRate: signups === 0 ? null : checkins / signups,
  };
}

// Misma regla que app.night_date: con la hora de reloj local, antes de las 08:00 sigue la noche anterior.
const SERVICE_DAY_START_HOUR = 8;

function localDateAndHour(now: Date, timeZone: string): { date: string; hour: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23",
    }).formatToParts(now).map((part) => [part.type, part.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

export function currentNight(now: Date, timeZone: string): string {
  const { date, hour } = localDateAndHour(now, timeZone);
  if (hour >= SERVICE_DAY_START_HOUR) return date;
  return isoDate(new Date(new Date(`${date}T00:00:00Z`).getTime() - MS_PER_DAY));
}
