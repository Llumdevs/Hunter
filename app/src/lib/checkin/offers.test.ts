import { describe, expect, it } from "vitest";
import { offersForNight, type Offer } from "./offers";

const offer = (id: string, daysOfWeek: number[]): Offer => ({
  id, title: id, description: null, includesAlcohol: false, daysOfWeek,
});

describe("offersForNight", () => {
  it("filtra por el día de la semana de la noche (13/11/2026 es viernes = 5)", () => {
    const offers = [offer("viernes", [5]), offer("findes", [6, 7]), offer("siempre", [1, 2, 3, 4, 5, 6, 7])];
    expect(offersForNight(offers, "2026-11-13").map((o) => o.id)).toEqual(["viernes", "siempre"]);
  });

  it("el domingo es el día 7", () => {
    expect(offersForNight([offer("domingo", [7])], "2026-11-15")).toHaveLength(1);
  });
});
