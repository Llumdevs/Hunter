import { ArrowLeft } from "lucide-react";
import { QrScannerView } from "./qr-scanner-view";
import { IconLink } from "@/components/ui";

export default function ScanPage() {
  return (
    <section className="flex flex-1 flex-col gap-6">
      <header className="flex items-center gap-3">
        <IconLink href="/" label="Volver al inicio"><ArrowLeft aria-hidden className="h-5 w-5" /></IconLink>
        <h1 className="text-2xl font-extrabold uppercase">Escanea el QR</h1>
      </header>
      <p className="text-muted">Apunta al QR de Hunter que hay en la barra o en la puerta del local.</p>
      <QrScannerView />
    </section>
  );
}
