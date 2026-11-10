export type OfferInput = {
  title: string;
  description: string;
  includesAlcohol: boolean;
  daysOfWeek: number[];
  validUntil: string;
};

// Forma de la fila de public.offers que edita el local.
export type OfferRow = {
  title: string;
  description: string | null;
  includes_alcohol: boolean;
  days_of_week: number[];
  valid_until_time: string | null;
};

export type OfferError =
  | "title_required" | "title_too_long" | "description_too_long"
  | "days_required" | "days_invalid" | "valid_until_invalid";

export type OfferValidation = { kind: "valid"; offer: OfferRow } | { kind: "invalid"; errors: OfferError[] };

const MAX_TITLE = 80;
const MAX_DESCRIPTION = 200;
const MONDAY = 1;
const SUNDAY = 7;
const HOUR_MINUTE = /^([01]\d|2[0-3]):[0-5]\d$/;

function titleErrors(title: string): OfferError[] {
  if (title.length === 0) return ["title_required"];
  return title.length > MAX_TITLE ? ["title_too_long"] : [];
}

function dayErrors(days: number[]): OfferError[] {
  if (days.length === 0) return ["days_required"];
  return days.every((day) => Number.isInteger(day) && day >= MONDAY && day <= SUNDAY) ? [] : ["days_invalid"];
}

export function validateOfferInput(input: OfferInput): OfferValidation {
  const title = input.title.trim();
  const description = input.description.trim();
  const errors: OfferError[] = [
    ...titleErrors(title),
    ...(description.length > MAX_DESCRIPTION ? (["description_too_long"] as const) : []),
    ...dayErrors(input.daysOfWeek),
    ...(input.validUntil !== "" && !HOUR_MINUTE.test(input.validUntil) ? (["valid_until_invalid"] as const) : []),
  ];
  if (errors.length > 0) return { kind: "invalid", errors };
  return {
    kind: "valid",
    offer: {
      title,
      description: description === "" ? null : description,
      includes_alcohol: input.includesAlcohol,
      days_of_week: [...new Set(input.daysOfWeek)].sort((a, b) => a - b),
      valid_until_time: input.validUntil === "" ? null : input.validUntil,
    },
  };
}
