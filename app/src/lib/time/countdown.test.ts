import { describe, expect, it } from "vitest";
import { formatLocalClock, remainingTime } from "./countdown";

const EXPIRES = new Date("2026-11-14T00:55:00Z");

describe("remainingTime", () => {
  it("cuenta minutos y segundos restantes", () => {
    expect(remainingTime(EXPIRES, new Date("2026-11-14T00:40:30Z"))).toEqual({ kind: "active", minutes: 14, seconds: 30 });
  });

  it("un segundo antes sigue activo", () => {
    expect(remainingTime(EXPIRES, new Date("2026-11-14T00:54:59Z"))).toEqual({ kind: "active", minutes: 0, seconds: 1 });
  });

  it("en el instante de caducidad ya ha caducado", () => {
    expect(remainingTime(EXPIRES, EXPIRES)).toEqual({ kind: "expired" });
  });

  it("redondea hacia arriba las fracciones de segundo", () => {
    expect(remainingTime(EXPIRES, new Date("2026-11-14T00:54:59.400Z"))).toEqual({ kind: "active", minutes: 0, seconds: 1 });
  });
});

describe("formatLocalClock", () => {
  it("muestra la hora de Madrid con segundos", () => {
    expect(formatLocalClock(new Date("2026-11-14T00:31:07Z"), "Europe/Madrid")).toBe("01:31:07");
  });

  it("respeta el horario de verano", () => {
    expect(formatLocalClock(new Date("2027-03-28T01:30:00Z"), "Europe/Madrid")).toBe("03:30:00");
  });
});
