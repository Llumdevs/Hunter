import { describe, expect, it } from "vitest";
import { AGE_BANDS, labelFor, MUSIC, PRICES, VIBES } from "./catalog";

describe("catálogo", () => {
  it("cada lista tiene valores únicos", () => {
    for (const list of [MUSIC, VIBES, PRICES, AGE_BANDS]) {
      expect(new Set(list.map((o) => o.value)).size).toBe(list.length);
    }
  });
  it("traduce un valor a su etiqueta", () => expect(labelFor(VIBES, "bailar")).toBe("Para bailar"));
  it("un valor desconocido se muestra tal cual", () => expect(labelFor(MUSIC, "polka")).toBe("polka"));
  it("sin valor no hay etiqueta", () => expect(labelFor(MUSIC, null)).toBeNull());
});
