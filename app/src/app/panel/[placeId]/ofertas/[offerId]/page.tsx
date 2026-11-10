import { Notice } from "@/components/ui";
import { BackLink } from "@/components/venue/day";
import { OfferForm } from "@/components/venue/offer-form";
import { loadStaffPlace } from "@/lib/venue/place-access";

export default async function EditOfferPage({ params }: { params: Promise<{ placeId: string; offerId: string }> }) {
  const { placeId, offerId } = await params;
  const { supabase, place } = await loadStaffPlace(placeId, `/panel/${placeId}/ofertas/${offerId}`);
  if (!place) return <Notice title="No tienes acceso a este local" />;
  const { data: offer } = await supabase
    .from("offers")
    .select("title, description, includes_alcohol, days_of_week, valid_until_time")
    .eq("id", offerId)
    .eq("place_id", placeId)
    .maybeSingle();
  if (!offer) return <Notice title="Oferta no encontrada" />;
  return (
    <section className="flex flex-col gap-5">
      <BackLink href={`/panel/${placeId}`}>{place.name}</BackLink>
      <h1 className="text-3xl font-extrabold">Editar oferta</h1>
      <OfferForm placeId={placeId} offerId={offerId} initial={offer} />
    </section>
  );
}
