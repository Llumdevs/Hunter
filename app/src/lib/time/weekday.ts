const SUNDAY_ISO = 7;

// Día ISO (1 lunes … 7 domingo) de una fecha YYYY-MM-DD, sin depender de la zona horaria.
export function isoWeekday(isoDate: string): number {
  const day = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
  return day === 0 ? SUNDAY_ISO : day;
}
