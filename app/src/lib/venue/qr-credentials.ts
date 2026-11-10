import "server-only";
import { loadStaffPlace } from "./place-access";

export type QrCredentials = { staticToken: string; screenSecret: string };

// Credenciales del QR del local para su personal; null si no hay acceso o el QR está revocado.
export async function loadQrCredentials(placeId: string, returnTo: string) {
  const { supabase, place } = await loadStaffPlace(placeId, returnTo);
  if (!place) return { place: null, credentials: null };
  const { data } = await supabase.rpc("place_qr_credentials", { p_place_id: placeId }).maybeSingle();
  const credentials: QrCredentials | null = data
    ? { staticToken: data.static_token, screenSecret: data.screen_secret }
    : null;
  return { place, credentials };
}
