import { describe, expect, it } from "vitest";
import { matchReason, recommend, scorePlace, type Preferences, type TonightPlace, type Weights } from "./recommend";

const WEIGHTS: Weights = { weight_music: 2, weight_vibe: 2, weight_age: 2, weight_price: 1, match_threshold: 0.6 };
const NO_PREFS: Preferences = { music: [], vibe: [], price: [], age_bands: [] };
const PREFS: Preferences = { music: ["house"], vibe: ["bailar"], price: ["€€"], age_bands: ["25-30"] };

const place = (id: string, overrides: Partial<TonightPlace> = {}): TonightPlace => ({
  id, name: id, music: "house", vibe: "bailar", price_level: "€€", age_band: "25-30", signups_any: false, ...overrides,
});

describe("scorePlace", () => {
  it("todo coincide: encaje 1", () => {
    expect(scorePlace(place("a"), PREFS, WEIGHTS)).toEqual({ fit: 1, music: true, vibe: true, age: true, price: true });
  });

  it("solo la música: 2 de 7", () => {
    expect(scorePlace(place("a", { vibe: "hablar", price_level: "€", age_band: "40+" }), PREFS, WEIGHTS).fit).toBeCloseTo(2 / 7);
  });

  it("el máximo solo cuenta los criterios que el usuario ha rellenado", () => {
    const onlyMusic = { ...NO_PREFS, music: ["house"] };
    expect(scorePlace(place("a", { vibe: "hablar" }), onlyMusic, WEIGHTS).fit).toBe(1);
  });

  it("sin gustos no hay encaje que calcular", () => {
    expect(scorePlace(place("a"), NO_PREFS, WEIGHTS).fit).toBeNull();
  });

  it("un local sin programación esta noche no coincide en música ni ambiente", () => {
    expect(scorePlace(place("a", { music: null, vibe: null }), PREFS, WEIGHTS)).toMatchObject({ music: false, vibe: false });
  });

  it("un local sin edad conocida no coincide en edad", () => {
    expect(scorePlace(place("a", { age_band: null }), PREFS, WEIGHTS).age).toBe(false);
  });
});

describe("recommend", () => {
  it("separa «Para ti» (encaje ≥ umbral) de «También te puede gustar»", () => {
    const result = recommend(
      [place("encaja"), place("solo-musica", { vibe: "hablar", price_level: "€", age_band: "40+" })],
      PREFS, WEIGHTS,
    );
    expect(result.forYou.map((r) => r.place.id)).toEqual(["encaja"]);
    expect(result.alsoLike.map((r) => r.place.id)).toEqual(["solo-musica"]);
  });

  it("el umbral es inclusivo (encaje 4/7 con umbral 4/7)", () => {
    const result = recommend([place("cuatro-septimos", { price_level: "€", age_band: "40+" })], PREFS, { ...WEIGHTS, match_threshold: 4 / 7 });
    expect(result.forYou).toHaveLength(1);
  });

  it("ordena «Para ti» por encaje y luego por nombre", () => {
    const result = recommend([place("b"), place("a"), place("c", { price_level: "€" })], PREFS, WEIGHTS);
    expect(result.forYou.map((r) => r.place.id)).toEqual(["a", "b", "c"]);
  });

  it("«También te puede gustar» muestra como mucho 3, los de más encaje", () => {
    const others = ["d", "e", "f", "g"].map((id, i) =>
      place(id, { vibe: "hablar", age_band: "40+", price_level: i === 0 ? "€€" : "€", music: i < 2 ? "house" : "pop" }));
    expect(recommend(others, PREFS, WEIGHTS).alsoLike.map((r) => r.place.id)).toEqual(["d", "e", "f"]);
  });

  it("sin gustos: todo en «Para ti», primero los que tienen gente apuntada", () => {
    const result = recommend([place("b"), place("a", { signups_any: true })], NO_PREFS, WEIGHTS);
    expect(result.forYou.map((r) => r.place.id)).toEqual(["a", "b"]);
    expect(result.alsoLike).toEqual([]);
  });
});

describe("matchReason", () => {
  const reason = (music: boolean, vibe: boolean, age: boolean) => matchReason({ fit: 0, music, vibe, age, price: false });
  it.each([
    [true, true, true, "Tu música, tu ambiente y gente de tu edad"],
    [true, true, false, "Encaja con tu música y con el ambiente que buscas"],
    [true, false, false, "Tu música, en otro tipo de ambiente"],
    [false, true, false, "El ambiente que buscas, con otra música"],
    [false, false, true, "Gente de tu edad, otro estilo"],
    [false, false, false, "Algo distinto para descubrir"],
  ])("música %s, ambiente %s, edad %s → «%s»", (music, vibe, age, text) => {
    expect(reason(music, vibe, age)).toBe(text);
  });
});
