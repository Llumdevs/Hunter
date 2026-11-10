// El catálogo de TypeScript (src/lib/tonight/catalog.ts) y el de la base de datos deben coincidir.
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { AGE_BANDS, MUSIC, PRICES, VIBES } from "@/lib/tonight/catalog";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

describe("catálogo de gustos", () => {
  it("la base de datos acepta todos los valores del catálogo de la app", async () => {
    const client = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
    const { error: signUpError } = await client.auth.signUp({ email: `it-${crypto.randomUUID()}@test.local`, password: crypto.randomUUID() });
    expect(signUpError).toBeNull();
    const all = (options: { value: string }[]) => options.map((o) => o.value);
    const { error } = await client.from("user_preferences").upsert({
      music: all(MUSIC), vibe: all(VIBES), price: all(PRICES), age_bands: all(AGE_BANDS),
    });
    expect(error).toBeNull();
  });

  it("y rechaza un valor que no está en el catálogo", async () => {
    const client = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
    await client.auth.signUp({ email: `it-${crypto.randomUUID()}@test.local`, password: crypto.randomUUID() });
    const { error } = await client.from("user_preferences").upsert({ music: ["polka"] });
    expect(error?.code).toBe("23514");
  });
});
