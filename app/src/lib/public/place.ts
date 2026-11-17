import "server-only";
import { cache } from "react";
import { z } from "zod";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { DEMO_PLACES } from "@/lib/demo/catalog";

export const publicPlaceSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i), name: z.string(), zone: z.string(), kind: z.string(), address: z.string(),
  city: z.string(), timezone: z.string(), lat: z.number(), lng: z.number(), price_level: z.string(),
  age_band: z.string().nullable(), age_source: z.string(), music: z.string().nullable(), vibe: z.string().nullable(),
  opens_at: z.string().nullable(), closes_at: z.string().nullable(),
  signups_visible: z.number().nullable(), signups_any: z.boolean(), cover_path: z.string().nullable(),
  is_open: z.boolean(), accepting_signups: z.boolean(),
  opening_hours: z.array(z.object({ weekday: z.number().int().min(1).max(7), opens_at: z.string(), closes_at: z.string() })),
  photos: z.array(z.object({ storage_path: z.string() })),
});
export type PublicPlace = z.infer<typeof publicPlaceSchema>;

export const loadPublicPlace = cache(async (id: string): Promise<{ place: PublicPlace; demo: boolean } | null> => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const demo = DEMO_PLACES.find((place) => place.id === id);
  if (demo) return { demo: true, place: { ...demo, address: "Ubicación ficticia de demostración", city: "Valencia", timezone: "Europe/Madrid", is_open: false, accepting_signups: false, photos: [], opening_hours: [] } };
  const { data, error } = await createSupabasePublicClient().rpc("public_place", { p_place: id });
  if (error) throw new Error("No hemos podido cargar la ficha pública del local.");
  if (data === null) return null;
  const parsed = publicPlaceSchema.safeParse(data);
  if (!parsed.success) throw new Error("No hemos podido confirmar los datos públicos de esta ficha.");
  return { place: parsed.data, demo: false };
});
