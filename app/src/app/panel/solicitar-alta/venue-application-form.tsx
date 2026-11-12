"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ErrorText, Field, PrimaryButton } from "@/components/ui";
import { StreetMap } from "@/components/tonight/street-map";
import { requestPosition } from "@/lib/geo/position";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { onboardingError, onboardingResultSchema, VENUE_KINDS, venueApplicationDetailsSchema } from "@/lib/venue/onboarding";
import { WEEKDAY_LABELS } from "@/lib/venue/weekdays";

const INPUT = "min-h-12 rounded-2xl border border-[#ece6e0] bg-day-card px-4 py-3 text-fg focus:outline-2 focus:outline-violet";

export function VenueApplicationForm() {
  const router = useRouter();
  const [lat, setLat] = useState(""); const [lng, setLng] = useState("");
  const [busy, setBusy] = useState(false); const [locating, setLocating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const pins = useMemo(() => lat && lng && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lng)) <= 180
    ? [{ id: "venue-location", name: "Ubicación del local", lat: Number(lat), lng: Number(lng), tone: "match" as const }] : [], [lat, lng]);
  function pickPosition(latitude: number, longitude: number) { setLat(latitude.toFixed(6)); setLng(longitude.toFixed(6)); }
  async function locate() {
    setLocating(true); setErrors([]);
    try {
      const result = await requestPosition(navigator.geolocation);
      if (result.kind === "granted") pickPosition(result.lat, result.lng);
      else setErrors(["No hemos podido obtener la ubicación. Toca el mapa o introduce las coordenadas del local."]);
    } catch { setErrors(["No hemos podido obtener la ubicación. Puedes elegirla en el mapa."]); }
    finally { setLocating(false); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setErrors([]);
    const form = new FormData(event.currentTarget);
    if (!lat.trim() || !lng.trim()) return setErrors(["Selecciona la ubicación del local en el mapa."]);
    const parsed = venueApplicationDetailsSchema.safeParse({
      name: form.get("name"), zone: form.get("zone"), address: form.get("address"), contact: form.get("contact"), kind: form.get("kind"), price: form.get("price"),
      lat: Number(lat), lng: Number(lng), days: form.getAll("days").map(Number), opens_at: form.get("opens_at"), closes_at: form.get("closes_at"),
    });
    if (!parsed.success) return setErrors(parsed.error.issues.map((issue) => issue.message));
    setBusy(true);
    try {
      const { data, error } = await createSupabaseBrowserClient().rpc("submit_venue_application", { p_details: parsed.data });
      const result = onboardingResultSchema.safeParse(data);
      if (error || !result.success || !result.data.ok) return setErrors([onboardingError(result.success ? result.data.error : undefined)]);
      router.replace("/panel?alta=enviada"); router.refresh();
    } catch { setErrors(["No hemos podido conectar. Inténtalo de nuevo."]); }
    finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="flex flex-col gap-4">
    <Field label="Nombre del local"><input name="name" required minLength={2} maxLength={80} className={INPUT} /></Field>
    <Field label="Tipo de local"><select name="kind" className={INPUT}>{VENUE_KINDS.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</select></Field>
    <Field label="Barrio / zona"><input name="zone" required minLength={2} maxLength={60} className={INPUT} /></Field>
    <Field label="Dirección en Valencia"><input name="address" autoComplete="street-address" required minLength={5} maxLength={200} className={INPUT} /></Field>
    <Field label="Email o teléfono de contacto"><input name="contact" required minLength={8} maxLength={120} className={INPUT} /></Field>
    <Field label="Precio orientativo"><select name="price" defaultValue="€€" className={INPUT}>{["€", "€€", "€€€"].map((price) => <option key={price} value={price}>{price}</option>)}</select></Field>
    <fieldset className="flex flex-col gap-3"><legend className="mb-2 font-bold">Ubicación del local</legend><p className="text-sm text-muted">Toca el mapa para marcar la entrada. Si estás allí, puedes usar tu ubicación actual.</p>
      <div className="relative isolate h-72 overflow-hidden rounded-3xl border border-[#ece6e0]"><StreetMap pins={pins} me={null} selectedId="venue-location" onSelect={() => {}} onPickPosition={pickPosition} /></div>
      <button type="button" disabled={locating || busy} onClick={locate} className="min-h-12 rounded-full bg-tile-sand px-4 font-bold">{locating ? "Buscando ubicación…" : "Estoy en el local: usar mi ubicación"}</button>
      <div className="grid grid-cols-2 gap-3"><Field label="Latitud"><input name="lat" value={lat} onChange={(e) => setLat(e.target.value)} type="number" min={-90} max={90} step="any" required className={`${INPUT} w-full`} /></Field><Field label="Longitud"><input name="lng" value={lng} onChange={(e) => setLng(e.target.value)} type="number" min={-180} max={180} step="any" required className={`${INPUT} w-full`} /></Field></div>
    </fieldset>
    <fieldset><legend className="mb-2 font-bold">Días de apertura</legend><div className="flex flex-wrap gap-2">{WEEKDAY_LABELS.map((day, index) => <label key={day} className="flex min-h-11 items-center gap-2 rounded-2xl bg-day-card px-3"><input type="checkbox" name="days" value={index + 1} defaultChecked aria-label={`Abre el ${day}`} />{day}</label>)}</div></fieldset>
    <div className="grid grid-cols-2 gap-3"><Field label="Apertura"><input name="opens_at" type="time" defaultValue="20:00" required className={`${INPUT} w-full`} /></Field><Field label="Cierre"><input name="closes_at" type="time" defaultValue="03:00" required className={`${INPUT} w-full`} /></Field></div>
    <p className="text-xs text-muted">Este horario se aplicará a los días seleccionados. Un cierre anterior a la apertura corresponde al día siguiente.</p>
    <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="authorized" required className="mt-1" /><span>Confirmo que estoy autorizado para solicitar el alta de este local y que los datos son correctos.</span></label>
    <PrimaryButton disabled={busy}>{busy ? "Enviando…" : "Enviar solicitud de alta"}</PrimaryButton>
    {errors.map((error, i) => <ErrorText key={`${i}-${error}`}>{error}</ErrorText>)}
  </form>;
}
