"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { publicEnv } from "@/lib/env";
import { checkInPath } from "@/lib/checkin/link";
import { computeScreenCode, msUntilNextStep, screenStep } from "@/lib/venue/screen-code";

type Props = { placeId: string; placeName: string; screenSecret: string };
type Frame = { url: string; svg: string };

async function buildFrame(placeId: string, screenSecret: string, now: Date): Promise<Frame> {
  const code = await computeScreenCode(screenSecret, screenStep(now));
  const url = `${publicEnv.appOrigin}${checkInPath({ placeId, credential: { type: "screen", code } })}`;
  return { url, svg: await QRCode.toString(url, { type: "svg", margin: 2, errorCorrectionLevel: "M" }) };
}

// Mantiene la pantalla encendida si el navegador lo permite (no todos lo soportan).
function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | undefined;
    navigator.wakeLock?.request("screen").then((sentinel) => (lock = sentinel)).catch(() => undefined);
    return () => void lock?.release();
  }, []);
}

export function ScreenQr({ placeId, placeName, screenSecret }: Props) {
  const [frame, setFrame] = useState<Frame | null>(null);
  const [failed, setFailed] = useState(false);
  useWakeLock();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    async function refresh() {
      const now = new Date();
      try {
        const next = await buildFrame(placeId, screenSecret, now);
        if (!cancelled) setFrame(next);
      } catch {
        if (!cancelled) setFailed(true);
        return;
      }
      timer = setTimeout(refresh, msUntilNextStep(new Date()));
    }
    refresh();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [placeId, screenSecret]);

  if (failed) return <p role="alert" className="text-danger">No se puede generar el QR. Recarga la página.</p>;
  return (
    <section className="-mx-5 -my-6 flex min-h-dvh flex-1 flex-col items-center justify-center gap-6 bg-white px-6 text-center text-day-ink">
      <p className="text-sm font-bold tracking-widest text-violet uppercase">Hunter</p>
      <h1 className="text-4xl font-black">{placeName}</h1>
      <p className="text-lg">Escanea para hacer check-in · el código cambia cada 30 segundos</p>
      {frame && (
        <div className="w-full max-w-sm" aria-label="QR de pantalla del local" data-qr-url={frame.url}
          dangerouslySetInnerHTML={{ __html: frame.svg }} />
      )}
    </section>
  );
}
