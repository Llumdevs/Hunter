// Mismos valores que app.*_catalog() en la migración 20261110160000_tonight.sql
// (tests/integration/tonight.test.ts comprueba que la base de datos los acepta todos).
export type Option = { value: string; label: string };

export const MUSIC: Option[] = [
  { value: "reggaeton", label: "Reggaetón" },
  { value: "techno", label: "Techno" },
  { value: "house", label: "House" },
  { value: "pop", label: "Pop" },
  { value: "indie", label: "Indie/rock" },
  { value: "jazz", label: "Jazz/soul" },
  { value: "flamenco", label: "Flamenco/rumba" },
  { value: "orquesta", label: "Orquesta" },
];

export const VIBES: Option[] = [
  { value: "bailar", label: "Para bailar" },
  { value: "hablar", label: "Para hablar" },
  { value: "directo", label: "Música en directo" },
  { value: "previa", label: "Previa" },
  { value: "verbena", label: "Verbena" },
];

export const PRICES: Option[] = [
  { value: "€", label: "€" },
  { value: "€€", label: "€€" },
  { value: "€€€", label: "€€€" },
];

export const AGE_BANDS: Option[] = [
  { value: "18-24", label: "18-24" },
  { value: "25-30", label: "25-30" },
  { value: "30-40", label: "30-40" },
  { value: "40+", label: "+40" },
];

export function labelFor(options: Option[], value: string | null): string | null {
  if (value === null) return null;
  return options.find((option) => option.value === value)?.label ?? value;
}
