// Flujo completo contra Supabase local (npm run db:reset aplica supabase/seed.sql antes).
// Comprueba el contrato real entre la base de datos y los parsers del frontend.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import { parseCheckInResult, parseRedeemResult } from "@/lib/checkin/results";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
const DEMO_PLACE = "30000000-0000-0000-0000-0000000000d1";
const DEMO_OFFER = "40000000-0000-0000-0000-0000000000d1";
const DEMO_TOKEN = "demo-token-0123456789abcdef";
const NEAR = { p_lat: 39.46215, p_lng: -0.3731 };
const REDEMPTION_WINDOW_MS = 15 * 60 * 1000;

async function signedInClient(): Promise<{ client: SupabaseClient; userId: string }> {
  const client = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  const email = `it-${crypto.randomUUID()}@test.local`;
  const { data, error } = await client.auth.signUp({ email, password: crypto.randomUUID() });
  if (error || !data.user) throw error ?? new Error("signUp sin usuario");
  return { client, userId: data.user.id };
}

const checkIn = (client: SupabaseClient) =>
  client.rpc("check_in", { p_place_id: DEMO_PLACE, p_static_token: DEMO_TOKEN, ...NEAR });

describe("flujo de check-in y canje", () => {
  let adult: { client: SupabaseClient; userId: string };
  let other: { client: SupabaseClient; userId: string };

  beforeAll(async () => {
    adult = await signedInClient();
    other = await signedInClient();
  });

  it("un menor no puede crear su perfil", async () => {
    const { error } = await other.client
      .from("profiles")
      .insert({ id: other.userId, display_name: "Menor", birthdate: "2015-01-01" });
    expect(error?.code).toBe("42501");
  });

  it("un adulto crea su perfil", async () => {
    const { error } = await adult.client
      .from("profiles")
      .insert({ id: adult.userId, display_name: "Adulta", birthdate: "2000-01-01" });
    expect(error).toBeNull();
  });

  it("hace check-in y luego no puede repetirlo esa noche", async () => {
    const first = await checkIn(adult.client);
    expect(parseCheckInResult(first.data)).toMatchObject({ ok: true, checkin: { placeId: DEMO_PLACE, geoOk: true } });
    const second = await checkIn(adult.client);
    expect(parseCheckInResult(second.data)).toEqual({ ok: false, error: "already_checked_in" });
  });

  it("canjea la oferta con una ventana de 15 minutos", async () => {
    const { data: rows } = await adult.client.from("checkins").select("id").eq("place_id", DEMO_PLACE);
    const { data } = await adult.client.rpc("redeem", { p_checkin_id: rows![0].id, p_offer_id: DEMO_OFFER });
    const result = parseRedeemResult(data);
    if (!result.ok) throw new Error(result.error);
    expect(result.redemption.expiresAt.getTime() - result.redemption.redeemedAt.getTime()).toBe(REDEMPTION_WINDOW_MS);
  });

  it("otro usuario no ve los check-ins ni los canjes ajenos", async () => {
    const [{ data: checkins }, { data: redemptions }] = await Promise.all([
      other.client.from("checkins").select("id"),
      other.client.from("redemptions").select("id"),
    ]);
    expect([checkins, redemptions]).toEqual([[], []]);
  });
});
