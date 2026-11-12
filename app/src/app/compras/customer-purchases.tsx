"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { ErrorText, Field, PrimaryButton } from "@/components/ui";
import { RewardsRules } from "@/components/rewards/rules";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { purchaseQr, requestSchema, rewardsError, type CustomerPurchase, type PurchaseVenue } from "@/lib/rewards/data";
import type { z } from "zod";

function QrImage({ value }: { value: string }) {
  const [svg, setSvg] = useState("");
  useEffect(() => { let cancelled = false; QRCode.toString(value, { type: "svg", margin: 2, errorCorrectionLevel: "M" }).then((image) => { if (!cancelled) setSvg(image); }).catch(() => { if (!cancelled) setSvg(""); }); return () => { cancelled = true; }; }, [value]);
  return svg ? <div aria-label="QR de compra para el personal" className="mx-auto w-full max-w-64 rounded-3xl bg-white p-3" dangerouslySetInnerHTML={{ __html: svg }} /> : <p className="text-sm text-muted">Preparando QR. También puedes usar el código de abajo.</p>;
}

export function CustomerPurchases({ venues, purchases }: { venues: PurchaseVenue[]; purchases: CustomerPurchase[] }) {
  const router = useRouter();
  const [place, setPlace] = useState(venues[0]?.id ?? "");
  const [request, setRequest] = useState<z.infer<typeof requestSchema> | null>(null);
  const [now, setNow] = useState(Date.now);
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (!request) return; const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [request]);
  const remaining = request ? Math.max(0, Math.ceil((Date.parse(request.expires_at) - now) / 1000)) : 0;
  async function generate() {
    setBusy(true); setError(null);
    try {
      const response = await createSupabaseBrowserClient().rpc("create_purchase_request", { p_place: place });
      const message = rewardsError(response.data, !!response.error);
      if (message) return setError(message);
      const parsed = requestSchema.safeParse(response.data);
      if (!parsed.success) return setError("No hemos podido preparar un QR válido.");
      setRequest(parsed.data); setNow(Date.now());
    } catch { setError("No hemos podido conectar. Inténtalo de nuevo."); } finally { setBusy(false); }
  }
  return <section className="flex flex-col gap-5"><h1 className="text-3xl font-extrabold">Mi QR de compra</h1><p className="text-sm text-muted">Elige el local y enseña el QR al personal después de pagar. Validar una compra es distinto de canjear una oferta. Hunter no procesa el pago.</p>
    {venues.length ? <div className="flex flex-col gap-3"><Field label="Local donde has comprado"><select value={place} onChange={(event) => { setPlace(event.target.value); setRequest(null); }} className="min-h-12 rounded-2xl border border-white/20 bg-night-900 p-3">{venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}{venue.is_demo ? " · Solo demo" : ""}</option>)}</select></Field><PrimaryButton disabled={busy} onClick={generate}>{request ? "Renovar mi QR de compra" : "Generar mi QR de compra"}</PrimaryButton><p className="text-xs text-muted">El QR caduca en cinco minutos y solo admite una compra. Renovarlo invalida el anterior.</p></div> : <p className="glass rounded-3xl p-4 text-muted">Todavía no hay locales disponibles. Para ensayar, crea tu local de prueba en el panel.</p>}
    {request && <div className="glass flex flex-col gap-3 rounded-3xl p-4">{request.is_demo && <p className="text-sm font-bold text-violet-soft">Demo · No suma puntos ni participa en el ranking.</p>}{remaining > 0 ? <><QrImage key={request.token} value={purchaseQr(request.place_id, request.token)} /><p role="status" className="text-center text-sm">Válido durante {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</p><details><summary className="cursor-pointer text-sm underline">Código para copiar al personal</summary><code className="mt-2 block select-all break-all text-xs">{purchaseQr(request.place_id, request.token)}</code></details></> : <p role="status" className="text-sm text-violet-soft">El QR ha caducado. Genera uno nuevo.</p>}</div>}
    {error && <ErrorText>{error}</ErrorText>}
    <button type="button" onClick={() => router.refresh()} className="min-h-11 text-left font-bold text-violet-soft">Actualizar mis compras</button>
    <section className="flex flex-col gap-3"><h2 className="text-xl font-bold">Compras registradas</h2>{purchases.length ? purchases.map((purchase) => <article key={purchase.id} className="glass flex flex-col gap-2 rounded-3xl p-4"><h3 className="font-bold">{purchase.place_name}</h3><p className="text-xs text-muted">{new Date(purchase.validated_at).toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}</p><p className="text-sm">{purchase.is_demo ? "Demo · " : ""}{purchase.cancelled ? "Anulada · sin puntos" : `${purchase.points} puntos`}</p></article>) : <p className="text-sm text-muted">Aún no tienes compras validadas por el personal.</p>}</section>
    <Link href="/ranking" className="min-h-11 font-bold text-violet-soft underline">Ver mis puntos del mes</Link>{venues.some((venue) => venue.is_demo) && <Link href="/panel" className="min-h-11 text-sm text-muted underline">Abrir panel del local para probar la validación</Link>}<RewardsRules />
  </section>;
}
