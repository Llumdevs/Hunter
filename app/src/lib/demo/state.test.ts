import { describe, expect, it } from "vitest";
import { DEMO_PLACES } from "./catalog";
import { demoPoints, initialDemoState, readDemoState } from "./state";

describe("estado de demostración", () => {
  it("una demo nueva no incluye una red social", () => {
    expect(initialDemoState()).toEqual({ plans: [] });
  });
  it("recupera un estado guardado válido", () => {
    const state = { ...initialDemoState(), plans: [{ placeId: DEMO_PLACES[0].id, checkedIn: true, purchaseValidated: false, rating: 4 }] };
    expect(readDemoState(JSON.stringify(state))).toEqual(state);
  });
  it.each([null, "invalid-json", JSON.stringify({ plans: [{ placeId: "real-place", checkedIn: true, rating: 5 }], friends: [] })])("restaura la demo si el almacenamiento es inválido: %s", (value) => {
    expect(readDemoState(value)).toEqual(initialDemoState());
  });
  it("migra planes antiguos sin otorgar puntos por check-in o valoración", () => {
    const migrated = readDemoState(JSON.stringify({ friends: [{ name: "Antiguo" }], plans: [{ placeId: DEMO_PLACES[0].id, checkedIn: true, rating: 5 }] }));
    expect(migrated).not.toHaveProperty("friends");
    expect(demoPoints(migrated)).toBe(0);
    expect(demoPoints({ plans: migrated.plans.map((p) => ({ ...p, purchaseValidated: true })) })).toBe(10);
  });
});
