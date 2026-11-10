import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { loadTonight } from "./load";
import { DEMO_PLACES } from "@/lib/demo/catalog";

function fakeClient(places: unknown[], error: object | null = null) {
  const chain = {
    select: () => chain, eq: () => chain,
    order: async () => ({ data: [] }), maybeSingle: async () => ({ data: null }),
  };
  return {
    rpc: async (name: string) => name === "tonight_places" ? { data: places, error } : { data: { weight_music: 2, weight_vibe: 2, weight_age: 2, weight_price: 1, match_threshold: 0.6 } },
    from: () => chain,
  } as unknown as Parameters<typeof loadTonight>[0];
}

describe("locales reales y demostración", () => {
  it("prepara locales y ofertas de ejemplo cuando la base está vacía", async () => {
    const data = await loadTonight(fakeClient([]), null);
    expect(data.demoMode).toBe(true);
    expect(data.places).toHaveLength(4);
    expect(Object.keys(data.offersByPlace)).toHaveLength(4);
    expect(data.loadError).toBeNull();
  });
  it("no mezcla ejemplos con los locales reales", async () => {
    const real = { ...DEMO_PLACES[0], id: "real-place", name: "Local real" };
    const data = await loadTonight(fakeClient([real]), null);
    expect(data.demoMode).toBe(false);
    expect(data.places).toEqual([real]);
  });
  it("un fallo de API no se disfraza de una base vacía", async () => {
    const data = await loadTonight(fakeClient([], { message: "unavailable" }), null);
    expect(data.demoMode).toBe(false);
    expect(data.loadError).toContain("No hemos podido cargar");
  });
});
