import { Notice } from "@/components/ui";
import { BackLink } from "@/components/venue/day";
import { OfferForm } from "@/components/venue/offer-form";
import { loadStaffPlace } from "@/lib/venue/place-access";

export default async function NewOfferPage({ params }: { params: Promise<{ placeId: string }> }) {
  const { placeId } = await params;
  const { place } = await loadStaffPlace(placeId, `/panel/${placeId}/ofertas/nueva`);
  if (!place) return <Notice title="No tienes acceso a este local" />;
  return (
    <section className="flex flex-col gap-5">
      <BackLink href={`/panel/${placeId}`}>{place.name}</BackLink>
      <h1 className="text-3xl font-extrabold">Nueva oferta</h1>
      <OfferForm placeId={placeId} />
    </section>
  );
}
