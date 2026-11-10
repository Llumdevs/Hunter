import { describe, expect, it } from "vitest";
import { projectPoints } from "./project";

const BOX = { width: 300, height: 150, padding: 15 };

describe("projectPoints", () => {
  it("un solo punto queda en el centro", () => {
    expect(projectPoints([{ lat: 39.46, lng: -0.37 }], BOX)).toEqual([{ x: 150, y: 75 }]);
  });

  it("el norte queda arriba y el este a la derecha, dentro del margen", () => {
    const [southWest, northEast] = projectPoints([{ lat: 39.46, lng: -0.38 }, { lat: 39.48, lng: -0.36 }], BOX);
    expect(southWest.x).toBeLessThan(northEast.x);
    expect(southWest.y).toBeGreaterThan(northEast.y);
    for (const p of [southWest, northEast]) {
      expect(p.x).toBeGreaterThanOrEqual(15);
      expect(p.x).toBeLessThanOrEqual(285);
      expect(p.y).toBeGreaterThanOrEqual(15);
      expect(p.y).toBeLessThanOrEqual(135);
    }
  });

  it("mantiene la proporción: no estira una zona estrecha", () => {
    const points = projectPoints([{ lat: 39.46, lng: -0.37 }, { lat: 39.48, lng: -0.37 }], BOX);
    expect(points[0].x).toBe(150);
    expect(points[1].x).toBe(150);
  });

  it("sin puntos devuelve una lista vacía", () => expect(projectPoints([], BOX)).toEqual([]));
});
