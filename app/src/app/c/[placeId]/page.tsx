import { CheckInFlow } from "./check-in-flow";
import { Notice } from "@/components/ui";
import { requireUserWithProfile } from "@/lib/auth/session";
import { parseCheckInParams } from "@/lib/checkin/link";
import type { Offer } from "@/lib/checkin/offers";

type PageProps = {
  params: Promise<{ placeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toSearchParams(query: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    for (const item of [value].flat()) if (item !== undefined) params.append(key, item);
  }
  return params;
}

export default async function CheckInPage({ params, searchParams }: PageProps) {
  const { placeId } = await params;
  const query = toSearchParams(await searchParams);
  const link = parseCheckInParams(placeId, query);
  if (link.kind === "invalid") {
    return <Notice title="QR no válido">Pide al personal el QR actual del local.</Notice>;
  }

  const { supabase } = await requireUserWithProfile(`/c/${placeId}?${query}`);
  const { data: place } = await supabase
    .from("places")
    .select("name, zone, offers(id, title, description, includes_alcohol, days_of_week, is_active), place_photos(storage_path, created_at)")
    .eq("id", placeId)
    .eq("is_active", true)
    .maybeSingle();
  if (!place) return <Notice title="Local no disponible">Este local no está en Hunter ahora mismo.</Notice>;

  const offers: Offer[] = place.offers
    .filter((offer) => offer.is_active)
    .map((offer) => ({
      id: offer.id,
      title: offer.title,
      description: offer.description,
      includesAlcohol: offer.includes_alcohol,
      daysOfWeek: offer.days_of_week,
    }));

  const coverPath = [...place.place_photos].sort((a, b) => a.created_at.localeCompare(b.created_at))[0]?.storage_path ?? null;
  return (
    <CheckInFlow placeId={placeId} placeName={place.name} zone={place.zone} coverPath={coverPath}
      credential={link.credential} offers={offers} />
  );
}
