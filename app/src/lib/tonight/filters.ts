export type TonightFilters = { music: string; vibe: string; price: string };
export const EMPTY_FILTERS: TonightFilters = { music: "", vibe: "", price: "" };

export function filterPlaces<P extends { music: string | null; vibe: string | null; price_level: string }>(places: P[], filters: TonightFilters): P[] {
  return places.filter((place) =>
    (!filters.music || place.music === filters.music) &&
    (!filters.vibe || place.vibe === filters.vibe) &&
    (!filters.price || place.price_level === filters.price));
}

export function fitPercentage(fit: number | null): string | null {
  return fit === null ? null : `${Math.round(Math.max(0, Math.min(1, fit)) * 100)} % para ti`;
}
