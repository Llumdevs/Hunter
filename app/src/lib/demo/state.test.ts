import { describe, expect, it } from "vitest";
import { DEMO_PLACES } from "./catalog";
import { demoPoints, initialDemoState, readDemoState } from "./state";

describe("estado de demostración", () => {
  it("una demo nueva tiene amigos de ejemplo y ningún plan real", () => {
    expect(initialDemoState().friends.map((friend) => friend.status)).toEqual(["accepted", "incoming", "outgoing"]);
    expect(initialDemoState().plans).toEqual([]);
  });
  it("recupera un estado guardado válido", () => {
    const state = { ...initialDemoState(), plans: [{ placeId: DEMO_PLACES[0].id, checkedIn: true, rating: 4 }] };
    expect(readDemoState(JSON.stringify(state))).toEqual(state);
  });
  it.each([null, "invalid-json", JSON.stringify({ plans: [{ placeId: "real-place", checkedIn: true, rating: 5 }], friends: [] })])("restaura la demo si el almacenamiento es inválido: %s", (value) => {
    expect(readDemoState(value)).toEqual(initialDemoState());
  });
  it("no da puntos demo por apuntarse ni por valorar sin check-in", () => {
    expect(demoPoints({ friends: [], plans: [{ placeId: DEMO_PLACES[0].id, checkedIn: false, rating: 5 }] })).toBe(0);
    expect(demoPoints({ friends: [], plans: [{ placeId: DEMO_PLACES[0].id, checkedIn: true, rating: null }] })).toBe(10);
    expect(demoPoints({ friends: [], plans: [{ placeId: DEMO_PLACES[0].id, checkedIn: true, rating: 5 }] })).toBe(15);
  });
});
