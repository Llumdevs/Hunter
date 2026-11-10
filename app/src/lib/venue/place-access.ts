import "server-only";
import { requireUserWithProfile } from "@/lib/auth/session";

// Comprobación de interfaz: la seguridad real está en RLS y en las funciones de la base de datos.
export async function loadStaffPlace(placeId: string, returnTo: string) {
  const { supabase } = await requireUserWithProfile(returnTo);
  const { data: place } = await supabase
    .from("places")
    .select("id, name, zone, is_active, is_demo, organizer_id, cities(timezone)")
    .eq("id", placeId)
    .maybeSingle();
  if (!place?.cities) return { supabase, place: null };
  const { data: membership } = await supabase
    .from("organizer_members")
    .select("organizer_id")
    .eq("organizer_id", place.organizer_id)
    .maybeSingle();
  return { supabase, place: membership ? { ...place, timeZone: place.cities.timezone } : null };
}
