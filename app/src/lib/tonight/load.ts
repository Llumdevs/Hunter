import "server-only";
import { z } from "zod";
import type { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Preferences, Weights } from "./recommend";

type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const weightsSchema = z.object({
  weight_music: z.number(), weight_vibe: z.number(), weight_age: z.number(), weight_price: z.number(),
  match_threshold: z.number(),
});

const NO_PREFERENCES: Preferences = { music: [], vibe: [], price: [], age_bands: [] };

export async function loadTonight(supabase: ServerClient, userId: string | null) {
  const [{ data: places }, { data: settings }, { data: prefs }] = await Promise.all([
    supabase.rpc("tonight_places"),
    supabase.rpc("recommendation_settings"),
    userId
      ? supabase.from("user_preferences").select("music, vibe, price, age_bands").eq("user_id", userId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return {
    places: places ?? [],
    weights: weightsSchema.parse(settings) satisfies Weights,
    preferences: (prefs ?? NO_PREFERENCES) satisfies Preferences,
  };
}

export type TonightData = Awaited<ReturnType<typeof loadTonight>>;
export type TonightPlaceRow = TonightData["places"][number];
