import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, filterPlaces, fitPercentage } from "./filters";

const places = [
  { id: "a", music: "house", vibe: "bailar", price_level: "€" },
  { id: "b", music: "house", vibe: "hablar", price_level: "€€" },
  { id: "c", music: null, vibe: null, price_level: "€" },
];
describe("filtros temporales", () => {
  it("sin filtros mantiene todos los locales y su orden", () => expect(filterPlaces(places, EMPTY_FILTERS)).toEqual(places));
  it("combina música, ambiente y precio", () => {
    expect(filterPlaces(places, { music: "house", vibe: "bailar", price: "€" }).map((p) => p.id)).toEqual(["a"]);
  });
  it("excluye programación desconocida si hay filtro", () => {
    expect(filterPlaces(places, { ...EMPTY_FILTERS, music: "house" }).map((p) => p.id)).toEqual(["a", "b"]);
  });
  it("puede devolver una lista vacía sin cambiar las preferencias", () => {
    const filters = { ...EMPTY_FILTERS, price: "€€€" };
    expect(filterPlaces(places, filters)).toEqual([]);
    expect(filters.price).toBe("€€€");
  });
});
describe("porcentaje de encaje", () => {
  it("no inventa un porcentaje sin gustos", () => expect(fitPercentage(null)).toBeNull());
  it.each([[0, "0 % para ti"], [0.8, "80 % para ti"], [2 / 3, "67 % para ti"], [1, "100 % para ti"]])("presenta %s como %s", (score, label) => {
    expect(fitPercentage(score)).toBe(label);
  });
});
