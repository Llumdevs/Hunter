import { PhotoManager } from "./photo-manager";
import { Notice } from "@/components/ui";
import { BackLink } from "@/components/venue/day";
import { loadStaffPlace } from "@/lib/venue/place-access";

export default async function PlacePhotosPage({ params }: { params: Promise<{ placeId: string }> }) {
  const { placeId } = await params;
  const { supabase, place } = await loadStaffPlace(placeId, `/panel/${placeId}/fotos`);
  if (!place) return <Notice title="No tienes acceso a este local" />;
  const { data: photos } = await supabase
    .from("place_photos")
    .select("id, storage_path")
    .eq("place_id", placeId)
    .order("created_at");

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <BackLink href={`/panel/${placeId}`}>{place.name}</BackLink>
        <h1 className="text-3xl font-extrabold">Fotos del local</h1>
        <p className="text-sm text-muted">La primera es la portada. JPG, PNG o WebP de hasta 5 MB.</p>
      </header>
      <PhotoManager placeId={placeId} placeName={place.name} photos={photos ?? []} />
    </section>
  );
}
