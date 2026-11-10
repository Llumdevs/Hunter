import { describe, expect, it } from "vitest";
import { nightBars } from "./bars";

const night = (night_date: string, signups: number, checkins: number) => ({
  night_date, signups, checkins, redemptions: 0, billable: 0,
});

describe("nightBars", () => {
  it("normaliza respecto al valor más alto de la semana y etiqueta el día", () => {
    expect(nightBars([night("2026-11-13", 40, 10), night("2026-11-14", 20, 5)])).toEqual([
      { nightDate: "2026-11-13", day: "V", signupsPct: 100, checkinsPct: 25 },
      { nightDate: "2026-11-14", day: "S", signupsPct: 50, checkinsPct: 12.5 },
    ]);
  });

  it("una semana sin actividad da barras a cero (sin dividir por cero)", () => {
    expect(nightBars([night("2026-11-15", 0, 0)])).toEqual([{ nightDate: "2026-11-15", day: "D", signupsPct: 0, checkinsPct: 0 }]);
  });

  it("si hay más check-ins que apuntados, el máximo es el de check-ins", () => {
    expect(nightBars([night("2026-11-09", 2, 4)])[0]).toMatchObject({ day: "L", signupsPct: 50, checkinsPct: 100 });
  });
});
