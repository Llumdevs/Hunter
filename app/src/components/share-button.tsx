"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

type Props = { title: string; text?: string; path: string; label?: string; compact?: boolean };

// Compartir únicamente rutas públicas explícitas; nunca la URL actual con códigos o tokens.
export function ShareButton({ title, text, path, label = "Compartir", compact = false }: Props) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [manual, setManual] = useState<string | null>(null);
  async function share() {
    setBusy(true); setNotice(null); setManual(null);
    const url = new URL(path, window.location.origin);
    if (url.origin !== window.location.origin) { setBusy(false); return; }
    const payload = { title, text, url: url.href };
    const copied = [title, text, url.href].filter(Boolean).join("\n");
    try {
      if (typeof navigator.share === "function") {
        await navigator.share(payload);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(copied);
        setNotice("Enlace copiado. Puedes pegarlo donde quieras.");
      } else {
        setManual(copied);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setNotice("No hemos podido abrir el menú de compartir. Puedes copiar el enlace.");
        setManual(copied);
      }
    } finally { setBusy(false); }
  }
  return <div className={compact ? "relative" : "flex flex-col gap-2"}>
    <button type="button" onClick={share} disabled={busy} aria-label={label} className={compact ? "glass grid h-11 w-11 place-items-center rounded-full text-fg disabled:opacity-50" : "flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 px-4 text-xs font-semibold text-violet-soft disabled:opacity-50"}><Share2 aria-hidden className="h-4 w-4" />{!compact && label}</button>
    {notice && <p role="status" className={compact ? "absolute top-14 right-0 z-10 w-64 rounded-2xl border border-white/15 bg-night-950 p-3 text-xs text-fg" : "text-xs text-muted"}>{notice}</p>}
    {manual && <label className={compact ? "absolute top-14 right-0 z-20 w-64 rounded-2xl bg-night-950 p-3 text-xs text-fg" : "flex flex-col gap-2 text-xs text-muted"}>Texto para compartir<textarea readOnly value={manual} onFocus={(event) => event.currentTarget.select()} rows={4} className="mt-2 w-full select-text rounded-xl border border-white/20 bg-night-900 p-3 text-fg" /></label>}
  </div>;
}
