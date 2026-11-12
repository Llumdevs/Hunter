import { loadStaffPlace } from "@/lib/venue/place-access";
import { staffHistorySchema } from "@/lib/rewards/data";
import { BackLink } from "@/components/venue/day";
import { Notice } from "@/components/ui";
import { StaffPurchases } from "./staff-purchases";

export default async function StaffPurchasesPage({ params }: { params: Promise<{ placeId: string }> }) {
  const { placeId } = await params;
  const { supabase, place } = await loadStaffPlace(placeId, `/panel/${placeId}/compras`);
  if (!place) return <Notice title="No tienes acceso a este local" />;
  const { data, error } = await supabase.rpc("place_purchase_history", { p_place: placeId });
  const history = staffHistorySchema.safeParse(data);
  return <><BackLink href={`/panel/${placeId}`}>{place.name}</BackLink>{!error && history.success ? <StaffPurchases placeId={placeId} placeName={place.name} isDemo={place.is_demo} purchases={history.data} /> : <Notice title="No hemos podido cargar las compras">Puede faltar aplicar la actualización de compras y puntos.</Notice>}</>;
}
