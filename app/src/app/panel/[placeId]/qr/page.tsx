import QRCode from "qrcode";
import { PrintButton } from "./print-button";
import { Notice } from "@/components/ui";
import { BackLink } from "@/components/venue/day";
import { publicEnv } from "@/lib/env";
import { checkInPath } from "@/lib/checkin/link";
import { loadQrCredentials } from "@/lib/venue/qr-credentials";

export default async function StaticQrPage({ params }: { params: Promise<{ placeId: string }> }) {
  const { placeId } = await params;
  const { place, credentials } = await loadQrCredentials(placeId, `/panel/${placeId}/qr`);
  if (!place) return <Notice title="No tienes acceso a este local" />;
  if (!credentials) return <Notice title="QR no disponible">El QR de este local está desactivado.</Notice>;

  const url = `${publicEnv.appOrigin}${checkInPath({ placeId, credential: { type: "static", token: credentials.staticToken } })}`;
  // SVG generado por la librería a partir de nuestra propia URL (sin datos del usuario).
  const svg = await QRCode.toString(url, { type: "svg", margin: 2, errorCorrectionLevel: "M" });

  return (
    <section className="flex flex-col items-center gap-4 text-center">
      <div className="self-start print:hidden"><BackLink href={`/panel/${placeId}`}>{place.name}</BackLink></div>
      <p className="text-sm font-bold tracking-widest text-orange uppercase">Hunter</p>
      <h1 className="text-3xl font-extrabold">{place.name}</h1>
      <p className="text-muted print:text-black">Escanea para hacer check-in y desbloquear la oferta</p>
      <div className="w-full max-w-xs rounded-[var(--radius-card)] bg-white p-4 shadow-[0_10px_30px_-18px_rgb(60_40_30/0.35)]" aria-label="QR fijo del local" data-qr-url={url}
        dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="text-sm text-muted print:hidden">Imprímelo y ponlo en la barra o en la puerta.</p>
      <PrintButton />
    </section>
  );
}
