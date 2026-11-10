import { describe, expect, it } from "vitest";
import { crowdLabel, distanceMeters, formatDistance } from "./format";

const RUZAFA = { lat: 39.462, lng: -0.373 };
const CARMEN = { lat: 39.479, lng: -0.38 };

describe("distanceMeters", () => {
  it("Ruzafa–El Carmen son unos 2 km", () => {
    expect(Math.round(distanceMeters(RUZAFA, CARMEN) / 100) * 100).toBe(2000);
  });
  it("misma posición: 0", () => expect(distanceMeters(RUZAFA, RUZAFA)).toBe(0));
});

describe("formatDistance", () => {
  it.each([
    [0, "aquí mismo"],
    [49, "aquí mismo"],
    [50, "50 m"],
    [454, "450 m"],
    [999, "1 km"],
    [1000, "1 km"],
    [1260, "1,3 km"],
    [12345, "12 km"],
  ])("%s m → «%s»", (meters, text) => {
    expect(formatDistance(meters)).toBe(text);
  });
});

describe("crowdLabel", () => {
  it("con cifra visible (≥15) la muestra", () => expect(crowdLabel(34, true)).toBe("34 apuntados"));
  it("con pocos apuntados no da la cifra", () => expect(crowdLabel(null, true)).toBe("Se está animando"));
  it("sin apuntados no dice nada", () => expect(crowdLabel(null, false)).toBeNull());
});
