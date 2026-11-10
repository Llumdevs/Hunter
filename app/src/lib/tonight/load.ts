import "server-only";
import { z } from "zod";
import type { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Preferences, Weights } from "./recommend";
import { tonightDate } from "./night";
import { isoWeekday } from "@/lib/time/weekday";
import { DEMO_PLACES, DEMO_OFFERS } from "@/lib/demo/catalog";

type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const weightsSchema = z.object({
  weight_music: z.number(), weight_vibe: z.number(), weight_age: z.number(), weight_price: z.number(),
  match_threshold: z.number(),
});

const NO_PREFERENCES: Preferences = { music: [], vibe: [], price: [], age_bands: [] };

export async function loadTonight(supabase: ServerClient, userId: string | null) {
  const [{ data: places, error: placesError }, { data: settings }, { data: prefs }, { data: offers }] = await Promise.all([
    supabase.rpc("tonight_places"),
    supabase.rpc("recommendation_settings"),
    userId
      ? supabase.from("user_preferences").select("music, vibe, price, age_bands").eq("user_id", userId).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("offers").select("place_id, title, days_of_week").eq("is_active", true).order("title"),
  ]);
  const weekday = isoWeekday(tonightDate());
  const demoMode = !placesError && (places?.length ?? 0) === 0;
  const parsedWeights = weightsSchema.safeParse(settings);
  return {
    places: demoMode ? DEMO_PLACES : places ?? [],
    weights: (parsedWeights.success ? parsedWeights.data : { weight_music: 2, weight_vibe: 2, weight_age: 2, weight_price: 1, match_threshold: 0.6 }) satisfies Weights,
    preferences: (prefs ?? NO_PREFERENCES) satisfies Preferences,
    offersByPlace: demoMode ? DEMO_OFFERS : Object.fromEntries((offers ?? []).filter((offer) => offer.days_of_week.includes(weekday)).map((offer) => [offer.place_id, offer.title])),
    demoMode,
    loadError: placesError ? "No hemos podido cargar los locales. Recarga la página para volver a intentarlo." : null,
  };
}

export type TonightData = Awaited<ReturnType<typeof loadTonight>>;
export type TonightPlaceRow = TonightData["places"][number];
