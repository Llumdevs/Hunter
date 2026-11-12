"use client";
import { useEffect, useRef, useState } from "react";

export function PurchaseScanner({ onRead }: { onRead: (value: string) => void }) {
  const video = useRef<HTMLVideoElement>(null); const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    let scanner: { start(): Promise<void>; stop(): void; destroy(): void } | undefined;
    async function start() {
      try {
        const { default: QrScanner } = await import("qr-scanner");
        if (cancelled || !video.current) return;
        scanner = new QrScanner(video.current, ({ data }) => { scanner?.stop(); onRead(data); }, { preferredCamera: "environment", returnDetailedScanResult: true, highlightScanRegion: true });
        await scanner.start();
      } catch { if (!cancelled) setError("No podemos usar la cámara. Revisa el permiso o pega el código del cliente."); }
    }
    void start(); return () => { cancelled = true; scanner?.destroy(); };
  }, [onRead]);
  return <div className="flex flex-col gap-2"><video ref={video} muted playsInline aria-label="Cámara para QR de compra" className="aspect-square rounded-3xl bg-day-ink object-cover" />{error && <p role="alert" className="text-sm text-rose">{error}</p>}</div>;
}
