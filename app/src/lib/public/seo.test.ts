import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe("indexación del sitio principal", () => {
  it.each([
    ["", "", "", "https://hunter.example", false],
    ["preview", "true", "", "https://hunter.example", false],
    ["production", "false", "", "https://hunter.example", false],
    ["production", "true", "preview", "https://hunter.example", false],
    ["production", "true", "development", "https://hunter.example", false],
    ["production", "true", "", "http://localhost:3100", false],
    ["production", "true", "production", "https://hunter.example", true],
    ["production", "true", "", "https://hunter.example", true],
  ])("entorno %s, opt-in %s, Vercel %s, origen %s → %s", async (environment, enabled, vercel, origin, expected) => {
    vi.stubEnv("HUNTER_ENV", environment);
    vi.stubEnv("HUNTER_INDEXING_ENABLED", enabled);
    vi.stubEnv("VERCEL_ENV", vercel);
    vi.stubEnv("NEXT_PUBLIC_APP_ORIGIN", origin);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "fixture-public-key");
    const { indexingEnabled, absoluteUrl } = await import("./seo");
    expect(indexingEnabled).toBe(expected);
    expect(absoluteUrl("/local/fixture")).toBe(`${origin}/local/fixture`);
  });
});
