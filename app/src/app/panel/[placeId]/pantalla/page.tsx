import { ScreenQr } from "./screen-qr";
import { Notice } from "@/components/ui";
import { loadQrCredentials } from "@/lib/venue/qr-credentials";

export default async function ScreenModePage({ params }: { params: Promise<{ placeId: string }> }) {
  const { placeId } = await params;
  const { place, credentials } = await loadQrCredentials(placeId, `/panel/${placeId}/pantalla`);
  if (!place) return <Notice title="No tienes acceso a este local" />;
  if (!credentials) return <Notice title="QR no disponible">El QR de este local está desactivado.</Notice>;
  return <ScreenQr placeId={placeId} placeName={place.name} screenSecret={credentials.screenSecret} />;
}
