"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { formatLocalClock, remainingTime } from "@/lib/time/countdown";

type Props = { placeName: string; offerTitle: string; displayCode: string; expiresAt: string; timeZone: string };

const TICK_MS = 1000;
const pad = (value: number) => String(value).padStart(2, "0");

export function RedemptionScreen({ placeName, offerTitle, displayCode, expiresAt, timeZone }: Props) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const remaining = remainingTime(new Date(expiresAt), now);
  const live = remaining.kind === "active";

  return (
    <section
      className={`-mx-5 -my-6 flex min-h-dvh flex-1 flex-col items-center justify-center gap-5 px-6 text-center text-night-950 ${
        live ? "redemption-live" : "bg-zinc-500"
      }`}
    >
      <p className="text-lg font-bold opacity-80">{placeName}</p>
      <h1 className="text-[40px] leading-none font-black tracking-tight">{offerTitle}</h1>
      <p className="text-6xl font-black tracking-tight tabular-nums" aria-label="Hora actual">
        {formatLocalClock(now, timeZone)}
      </p>
      <p className="rounded-2xl bg-night-950 px-5 py-3 font-mono text-3xl font-extrabold tracking-[0.18em] text-white">{displayCode}</p>
      <p className="flex items-center gap-2 rounded-full bg-white/60 px-5 py-3 text-xl font-extrabold" aria-live="polite">
        <Clock aria-hidden className="h-5 w-5" />
        <span>{live ? `Válido ${pad(remaining.minutes)}:${pad(remaining.seconds)}` : "Canje caducado"}</span>
      </p>
      <p className="max-w-64 text-sm font-semibold opacity-75">Enseña esta pantalla al camarero. El fondo se mueve: una captura no sirve.</p>
    </section>
  );
}
