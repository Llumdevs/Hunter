export type ProfileInput = { displayName: string; birthdate: string };
export type ProfileError = "name_required" | "name_too_long" | "birthdate_invalid" | "underage";
export type ProfileValidation =
  | { kind: "valid"; profile: ProfileInput }
  | { kind: "invalid"; errors: ProfileError[] };

export const ADULT_AGE = 18;
const MAX_NAME_LENGTH = 60;
const MIN_BIRTH_YEAR = 1900;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_LENGTH = 10;

type CalendarDate = { year: number; month: number; day: number };

function parseCalendarDate(value: string): CalendarDate | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  // Date.UTC desborda las fechas imposibles (31/04 → 01/05): si al normalizar cambia, no existe.
  const normalized = new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, ISO_DATE_LENGTH);
  return normalized === value ? { year, month, day } : null;
}

function isAdultOn(birth: CalendarDate, today: Date): boolean {
  const adulthood = Date.UTC(birth.year + ADULT_AGE, birth.month - 1, birth.day);
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return adulthood <= todayUtc;
}

function nameErrors(name: string): ProfileError[] {
  if (name.length === 0) return ["name_required"];
  return name.length > MAX_NAME_LENGTH ? ["name_too_long"] : [];
}

function birthdateErrors(birthdate: string, today: Date): ProfileError[] {
  const birth = parseCalendarDate(birthdate);
  if (!birth || birth.year < MIN_BIRTH_YEAR) return ["birthdate_invalid"];
  return isAdultOn(birth, today) ? [] : ["underage"];
}

export function validateProfileInput(input: ProfileInput, today: Date): ProfileValidation {
  const displayName = input.displayName.trim();
  const errors = [...nameErrors(displayName), ...birthdateErrors(input.birthdate, today)];
  return errors.length === 0 ? { kind: "valid", profile: { displayName, birthdate: input.birthdate } } : { kind: "invalid", errors };
}
