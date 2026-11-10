import { describe, expect, it } from "vitest";
import { currentNight, lastNights, summarizeNights } from "./stats";

describe("lastNights", () => {
  it("devuelve el rango de las últimas 7 noches terminando en la indicada", () => {
    expect(lastNights("2026-11-13", 7)).toEqual({ from: "2026-11-07", to: "2026-11-13" });
  });

  it("cruza el cambio de mes", () => {
    expect(lastNights("2026-12-02", 3)).toEqual({ from: "2026-11-30", to: "2026-12-02" });
  });
});

describe("summarizeNights", () => {
  const night = (signups: number, checkins: number, redemptions: number, billable: number) => ({
    night_date: "2026-11-13", signups, checkins, redemptions, billable,
  });

  it("suma las noches y calcula la tasa de check-in", () => {
    expect(summarizeNights([night(10, 4, 3, 2), night(10, 2, 1, 1)])).toEqual({
      signups: 20, checkins: 6, redemptions: 4, billable: 3, checkinRate: 0.3,
    });
  });

  it("sin apuntados la tasa no existe (no es 0 ni NaN)", () => {
    expect(summarizeNights([night(0, 2, 0, 0)]).checkinRate).toBeNull();
  });
});

describe("currentNight", () => {
  it("a las 01:30 del sábado en Madrid, la noche en curso es la del viernes", () => {
    expect(currentNight(new Date("2026-11-14T00:30:00Z"), "Europe/Madrid")).toBe("2026-11-13");
  });

  it("a las 08:00 en Madrid ya es el día nuevo", () => {
    expect(currentNight(new Date("2026-11-14T07:00:00Z"), "Europe/Madrid")).toBe("2026-11-14");
  });

  it("la mañana del cambio de hora (08:30 CEST) ya es el día nuevo, como en la base de datos", () => {
    expect(currentNight(new Date("2027-03-28T06:30:00Z"), "Europe/Madrid")).toBe("2027-03-28");
  });

  it("a las 07:59 en Madrid sigue siendo la noche anterior", () => {
    expect(currentNight(new Date("2026-11-14T06:59:00Z"), "Europe/Madrid")).toBe("2026-11-13");
  });
});
