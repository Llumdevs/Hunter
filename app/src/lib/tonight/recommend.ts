// Recomendación del brief (§6): sencilla, explicable y con pesos configurables (public.recommendation_settings).

export type Weights = {
  weight_music: number;
  weight_vibe: number;
  weight_age: number;
  weight_price: number;
  match_threshold: number;
};

export type Preferences = { music: string[]; vibe: string[]; price: string[]; age_bands: string[] };

export type TonightPlace = {
  id: string;
  name: string;
  music: string | null;
  vibe: string | null;
  price_level: string;
  age_band: string | null;
  signups_any: boolean;
};

// fit es null cuando el usuario no tiene gustos: no hay encaje que calcular.
export type Score = { fit: number | null; music: boolean; vibe: boolean; age: boolean; price: boolean };
export type Ranked<P extends TonightPlace> = { place: P; score: Score };

const ALSO_LIKE_MAX = 3;

const matches = (wanted: string[], value: string | null) => value !== null && wanted.includes(value);

export function scorePlace(place: TonightPlace, prefs: Preferences, weights: Weights): Score {
  const criteria = [
    { key: "music", wanted: prefs.music, value: place.music, weight: weights.weight_music },
    { key: "vibe", wanted: prefs.vibe, value: place.vibe, weight: weights.weight_vibe },
    { key: "age", wanted: prefs.age_bands, value: place.age_band, weight: weights.weight_age },
    { key: "price", wanted: prefs.price, value: place.price_level, weight: weights.weight_price },
  ] as const;
  const hit = Object.fromEntries(criteria.map((c) => [c.key, matches(c.wanted, c.value)])) as Record<
    (typeof criteria)[number]["key"], boolean
  >;
  const filled = criteria.filter((c) => c.wanted.length > 0);
  const max = filled.reduce((sum, c) => sum + c.weight, 0);
  const points = filled.reduce((sum, c) => sum + (hit[c.key] ? c.weight : 0), 0);
  return { fit: max === 0 ? null : points / max, ...hit };
}

const byFitThenName = <P extends TonightPlace>(a: Ranked<P>, b: Ranked<P>) =>
  (b.score.fit ?? 0) - (a.score.fit ?? 0) || a.place.name.localeCompare(b.place.name, "es");

const byActivityThenName = <P extends TonightPlace>(a: Ranked<P>, b: Ranked<P>) =>
  Number(b.place.signups_any) - Number(a.place.signups_any) || a.place.name.localeCompare(b.place.name, "es");

export function recommend<P extends TonightPlace>(places: P[], prefs: Preferences, weights: Weights) {
  const ranked = places.map((place) => ({ place, score: scorePlace(place, prefs, weights) }));
  const hasPreferences = ranked.some((r) => r.score.fit !== null);
  if (!hasPreferences) return { forYou: [...ranked].sort(byActivityThenName), alsoLike: [] as Ranked<P>[] };

  const sorted = [...ranked].sort(byFitThenName);
  return {
    forYou: sorted.filter((r) => (r.score.fit ?? 0) >= weights.match_threshold),
    alsoLike: sorted.filter((r) => (r.score.fit ?? 0) < weights.match_threshold).slice(0, ALSO_LIKE_MAX),
  };
}

export function matchReason(score: Score): string {
  if (score.music && score.vibe && score.age) return "Tu música, tu ambiente y gente de tu edad";
  if (score.music && score.vibe) return "Encaja con tu música y con el ambiente que buscas";
  if (score.music) return "Tu música, en otro tipo de ambiente";
  if (score.vibe) return "El ambiente que buscas, con otra música";
  if (score.age) return "Gente de tu edad, otro estilo";
  return "Algo distinto para descubrir";
}
