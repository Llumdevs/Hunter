"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ErrorText } from "@/components/ui";
import { publicEnv } from "@/lib/env";
import { checkInPath, parseCheckInLink } from "@/lib/checkin/link";

const FOREIGN_QR_MESSAGE = "Ese QR no es de Hunter. Busca el QR de Hunter del local.";
const CAMERA_ERROR_MESSAGE = "No podemos usar la cámara. Revisa los permisos o escanea con la cámara del móvil.";

export function QrScannerView() {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let scanner: { start(): Promise<void>; destroy(): void } | undefined;
    let cancelled = false;

    async function start() {
      const { default: QrScanner } = await import("qr-scanner");
      if (cancelled || !video.current) return;
      scanner = new QrScanner(
        video.current,
        ({ data }) => {
          const link = parseCheckInLink(data, publicEnv.appOrigin);
          if (link.kind === "valid") return router.push(checkInPath(link));
          setError(link.reason === "foreign_origin" ? FOREIGN_QR_MESSAGE : "Este QR no es válido.");
        },
        { preferredCamera: "environment", returnDetailedScanResult: true, highlightScanRegion: true },
      );
      await scanner.start().catch(() => setError(CAMERA_ERROR_MESSAGE));
    }

    start();
    return () => {
      cancelled = true;
      scanner?.destroy();
    };
  }, [router]);

  return (
    <div className="flex flex-col gap-4">
      <video ref={video} className="glass aspect-square w-full rounded-[var(--radius-card)] bg-night-950 object-cover" muted playsInline />
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}
