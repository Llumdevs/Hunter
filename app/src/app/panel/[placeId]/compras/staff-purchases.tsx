"use client";
import { useCallback, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ErrorText, Field, PrimaryButton } from "@/components/ui";
import { PurchaseScanner } from "@/components/rewards/purchase-scanner";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { parsePurchaseQr, resultSchema, rewardsError, type StaffPurchase } from "@/lib/rewards/data";

const INPUT = "min-h-12 rounded-2xl border border-[#ece6e0] bg-day-card p-3 text-fg";

export function StaffPurchases({ placeId, placeName, isDemo, purchases }: { placeId: string; placeName: string; isDemo: boolean; purchases: StaffPurchase[] }) {
  const router = useRouter(); const [input, setInput] = useState(""); const [checked, setChecked] = useState<string | null>(null); const [operation, setOperation] = useState("");
  const [camera, setCamera] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null); const [notice, setNotice] = useState<string | null>(null); const [cancelling, setCancelling] = useState<string | null>(null);
  const onRead = useCallback((value: string) => { setInput(value); setChecked(null); setCamera(false); }, []);
  async function inspect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setNotice(null); setChecked(null);
    const token = parsePurchaseQr(input, placeId);
    if (!token) return setError("Ese código no es un QR de compra para este local. Usa el QR del cliente, no el QR de check-in.");
    setBusy(true);
    try {
      const response = await createSupabaseBrowserClient().rpc("inspect_purchase_request", { p_place: placeId, p_token: token });
      const message = rewardsError(response.data, !!response.error); if (message) return setError(message);
      setChecked(token); setOperation(crypto.randomUUID()); setNotice("QR válido. Comprueba el pago y confirma la compra con la referencia del ticket.");
    } catch { setError("No hemos podido conectar. Inténtalo de nuevo."); } finally { setBusy(false); }
  }
  async function validate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!checked) return;
    const receipt = String(new FormData(event.currentTarget).get("receipt") ?? "").trim();
    setBusy(true); setError(null); setNotice(null);
    try {
      const response = await createSupabaseBrowserClient().rpc("validate_purchase", { p_place: placeId, p_token: checked, p_receipt: receipt, p_operation: operation });
      const message = rewardsError(response.data, !!response.error); if (message) return setError(message);
      const result = resultSchema.parse(response.data);
      setNotice(result.cancelled ? "La operación ya estaba anulada y no se ha reactivado." : result.is_demo ? "Compra demo registrada. No suma puntos ni participa en el ranking." : `Compra registrada: ${result.purchase_points ?? 0} puntos para el cliente.${result.purchase_points === 0 ? " Ha alcanzado el límite de este local o de esta noche." : ""}`);
      setInput(""); setChecked(null); router.refresh();
    } catch { setError("No hemos recibido confirmación. Reintenta sin cambiar el ticket; la misma operación no se registrará dos veces."); } finally { setBusy(false); }
  }
  async function cancel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!cancelling) return;
    const reason = String(new FormData(event.currentTarget).get("reason") ?? "").trim();
    setBusy(true); setError(null); setNotice(null);
    try {
      const response = await createSupabaseBrowserClient().rpc("cancel_validated_purchase", { p_purchase: cancelling, p_reason: reason });
      const message = rewardsError(response.data, !!response.error); if (message) return setError(message);
      setCancelling(null); setNotice("Compra anulada. Se han retirado los puntos asociados y se ha revisado el premio de invitación."); router.refresh();
    } catch { setError("No hemos podido conectar. Inténtalo de nuevo."); } finally { setBusy(false); }
  }
  return <section className="mt-4 flex flex-col gap-5"><header><p className="text-sm text-muted">{placeName}</p><h1 className="text-3xl font-extrabold">Validar compras</h1></header><p className="text-sm text-muted">Pide al cliente su QR de compra para este local. Confirma después de comprobar el pago. Este registro no procesa cobros y no es un canje de oferta.</p>
    {isDemo && <div className="rounded-3xl bg-tile-sand p-4 text-sm"><b>Modo demo · Sin puntos reales.</b><p className="mt-2">Abre Mi QR de compra en otra pestaña, selecciona tu local demo y pega aquí el código. Puedes validar y anular sin otra cuenta.</p><Link href="/compras" className="mt-2 inline-flex min-h-11 items-center font-bold text-orange underline">Abrir Mi QR de compra</Link></div>}
    <button type="button" onClick={() => setCamera(!camera)} className="min-h-12 rounded-full bg-tile-sand px-4 font-bold">{camera ? "Cerrar cámara" : "Escanear QR del cliente"}</button>{camera && <PurchaseScanner onRead={onRead} />}
    <form onSubmit={inspect} className="flex flex-col gap-3"><Field label="QR o código de compra del cliente"><textarea value={input} onChange={(e) => { setInput(e.target.value); setChecked(null); }} required maxLength={180} rows={3} autoComplete="off" spellCheck={false} className={INPUT} /></Field><PrimaryButton disabled={busy}>Comprobar QR de compra</PrimaryButton></form>
    {checked && <form onSubmit={validate} className="flex flex-col gap-3 rounded-3xl bg-day-card p-4"><Field label="Referencia del ticket"><input name="receipt" required minLength={3} maxLength={80} autoComplete="off" className={INPUT} /></Field><p className="text-xs text-muted">Usa el identificador del ticket, sin nombre ni datos del cliente. Solo guardamos su huella para evitar duplicados.</p><label className="flex items-start gap-3 text-sm"><input type="checkbox" required name="paid" className="mt-1" /><span>He comprobado que la compra está pagada y corresponde a este QR.</span></label><PrimaryButton disabled={busy}>Confirmar compra pagada</PrimaryButton></form>}
    {notice && <p role="status" className="rounded-2xl bg-tile-lime p-4 text-sm">{notice}</p>}{error && <ErrorText>{error}</ErrorText>}
    <section className="flex flex-col gap-3"><h2 className="text-xl font-bold">Últimas operaciones</h2>{!purchases.length && <p className="text-sm text-muted">Todavía no hay compras registradas.</p>}{purchases.map((purchase) => <article key={purchase.id} className="flex flex-col gap-2 rounded-3xl bg-day-card p-4"><h3 className="font-bold">Operación {purchase.id.slice(0, 8)}{purchase.is_demo ? " · Demo" : ""}</h3><p className="text-xs text-muted">{new Date(purchase.validated_at).toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}</p><p className="text-sm">{purchase.cancelled ? "Anulada" : "Validada"}</p>{purchase.cancellation_reason && <p className="text-sm text-muted">{purchase.cancellation_reason}</p>}{!purchase.cancelled && <button type="button" disabled={busy} onClick={() => setCancelling(purchase.id)} className="min-h-11 text-left text-sm text-orange underline">Anular esta compra</button>}{cancelling === purchase.id && <form onSubmit={cancel} className="flex flex-col gap-3"><Field label="Motivo de anulación"><input name="reason" required minLength={5} maxLength={200} placeholder="Sin datos personales" className={INPUT} /></Field><button disabled={busy} className="min-h-12 rounded-full bg-orange px-4 font-bold text-white">Confirmar anulación</button><button type="button" onClick={() => setCancelling(null)} className="min-h-11 text-sm underline">Mantener la compra</button></form>}</article>)}</section>
  </section>;
}
