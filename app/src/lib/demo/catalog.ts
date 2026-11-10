import type { Database } from "@/lib/supabase/database.types";

type RawPlace = Database["public"]["Functions"]["tonight_places"]["Returns"][number];
// PostgreSQL puede devolver NULL en estas columnas calculadas, aunque el generador
// de tipos de las funciones tabulares no refleje su nulabilidad.
type Place = Omit<RawPlace, "age_band" | "signups_visible" | "cover_path"> & { age_band: string | null; signups_visible: number | null; cover_path: string | null };
const base = { opens_at: "20:00:00", closes_at: "06:00:00", age_band: null, age_source: "venue", signups_visible: null, signups_any: false, cover_path: null };
export const DEMO_PLACES: Place[] = [
  { ...base, id: "d0000000-0000-4000-8000-000000000001", name: "Sala Neón · Demo", zone: "Ruzafa", kind: "club", lat: 39.4608, lng: -0.3752, price_level: "€€", music: "house", vibe: "bailar" },
  { ...base, id: "d0000000-0000-4000-8000-000000000002", name: "Jazz Cellar · Demo", zone: "Cánovas", kind: "directo", lat: 39.466, lng: -0.3651, price_level: "€€€", music: "jazz", vibe: "directo" },
  { ...base, id: "d0000000-0000-4000-8000-000000000003", name: "La Terraza · Demo", zone: "El Carmen", kind: "bar", lat: 39.479, lng: -0.3801, price_level: "€", music: "indie", vibe: "hablar" },
  { ...base, id: "d0000000-0000-4000-8000-000000000004", name: "El Patio · Demo", zone: "Benimaclet", kind: "previa", lat: 39.4871, lng: -0.3602, price_level: "€", music: "pop", vibe: "previa" },
];
export const DEMO_OFFERS: Record<string, string> = {
  [DEMO_PLACES[0].id]: "Entrada de ejemplo a 5 €",
  [DEMO_PLACES[1].id]: "Mesa de ejemplo junto al escenario",
  [DEMO_PLACES[2].id]: "Refresco de ejemplo con tu consumición",
  [DEMO_PLACES[3].id]: "Tapa de ejemplo con tu primera ronda",
};
export const DEMO_EVENTS = [
  { placeId: DEMO_PLACES[0].id, title: "House en Ruzafa", time: "23:00", description: "Una sesión para probar cómo elegir un plan para bailar." },
  { placeId: DEMO_PLACES[1].id, title: "Jazz a media luz", time: "22:00", description: "Concierto simulado para descubrir música en directo." },
  { placeId: DEMO_PLACES[2].id, title: "Indie y charla", time: "21:00", description: "Un encuentro de ejemplo para una noche tranquila." },
  { placeId: DEMO_PLACES[3].id, title: "La previa del Patio", time: "20:30", description: "Un plan de ejemplo para empezar la noche con amigos." },
];
export const isDemoPlace = (id: string) => DEMO_PLACES.some((place) => place.id === id);
