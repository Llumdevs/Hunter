"use client";

import Link from "next/link";
import { useDemo } from "./provider";
import { DEMO_EVENTS, DEMO_PLACES } from "@/lib/demo/catalog";
import { demoPoints } from "@/lib/demo/state";

export function DemoBanner() {
  return <p className="rounded-2xl border border-white/10 bg-white/[.025] px-3 py-2 text-[11px] leading-relaxed text-muted">Demo · Locales, eventos y ofertas simulados en Valencia. Imágenes de ambiente generadas con IA. No son reservas ni promociones reales.</p>;
}

export function DemoEvents() {
  return <section aria-label="Eventos simulados" className="flex flex-col gap-3">
    <h2 className="text-lg font-bold">Eventos de prueba esta noche</h2>
    {DEMO_EVENTS.map((event) => <Link key={event.placeId} href={`/local/${event.placeId}`} className="glass flex flex-col gap-2 rounded-[28px] p-5">
      <div className="flex items-center justify-between gap-3"><h3 className="font-bold">{event.title}</h3><span className="text-xs text-lime">Demo · {event.time}</span></div>
      <p className="text-sm text-muted">{event.description}</p>
    </Link>)}
  </section>;
}

export function DemoSignup({ placeId }: { placeId: string }) {
  const { state, update, ready } = useDemo();
  const selected = state.plans.some((plan) => plan.placeId === placeId);
  return <div className="fixed inset-x-0 bottom-6 z-10 mx-auto w-[calc(100%-2.5rem)] max-w-md">
    {selected ? <Link href="/planes" className="glass flex min-h-14 items-center justify-center rounded-full font-bold">✓ Plan demo guardado · ver Mis planes</Link>
      : <button type="button" disabled={!ready} onClick={() => update((current) => ({ ...current, plans: [...current.plans.filter((plan) => plan.placeId !== placeId), { placeId, checkedIn: false, purchaseValidated: false, rating: null }] }))} className="flex min-h-14 w-full items-center justify-center rounded-full bg-orange p-3 font-bold text-white disabled:opacity-50">Apuntarme a este plan demo</button>}
  </div>;
}

export function DemoPlans() {
  const { state, update, ready } = useDemo();
  if (!ready || state.plans.length === 0) return null;
  return <section aria-label="Planes demo" className="flex flex-col gap-3">
    <h2 className="text-lg font-bold">Tus planes simulados</h2><DemoBanner />
    {state.plans.map((plan) => {
      const place = DEMO_PLACES.find((item) => item.id === plan.placeId)!;
      const event = DEMO_EVENTS.find((item) => item.placeId === plan.placeId)!;
      return <article key={plan.placeId} className="glass flex flex-col gap-3 rounded-3xl p-4">
        <Link href={`/local/${plan.placeId}`} className="font-bold">{event.title}</Link>
        <p className="text-sm text-muted">{place.name} · {event.time} · Demo</p>
        {plan.checkedIn ? <>
          <p className="font-semibold text-lime">Check-in simulado · sin puntos</p>
          {plan.rating === null ? <label className="text-sm">Valorar la visita demo<select aria-label={`Valorar ${event.title}`} defaultValue="" onChange={(e) => { const rating = Number(e.target.value); update((current) => ({ ...current, plans: current.plans.map((p) => p.placeId === plan.placeId ? { ...p, rating } : p) })); }} className="mt-2 w-full rounded-xl border border-white/20 bg-night-900 p-3"><option value="" disabled>Elige una puntuación</option>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} de 5 ★</option>)}</select></label>
            : <p className="text-sm text-lime">Tu valoración demo: {plan.rating} de 5 ★</p>}
        </> : <button type="button" onClick={() => update((current) => ({ ...current, plans: current.plans.map((p) => p.placeId === plan.placeId ? { ...p, checkedIn: true } : p) }))} className="min-h-11 rounded-full bg-lime px-4 font-bold text-night-950">Simular check-in</button>}
        {plan.purchaseValidated ? <p className="text-lime">Compra simulada · +10 puntos demo</p> : <button type="button" onClick={() => update((current) => ({ ...current, plans: current.plans.map((p) => p.placeId === plan.placeId ? { ...p, purchaseValidated: true } : p) }))} className="min-h-11 rounded-full bg-orange p-3 font-bold">Simular compra validada</button>}
        <button type="button" onClick={() => update((current) => ({ ...current, plans: current.plans.filter((p) => p.placeId !== plan.placeId) }))} className="min-h-11 text-sm text-muted underline">Quitar plan demo</button>
      </article>;
    })}
  </section>;
}

export function DemoControls() {
  const { state, reset, ready, storageFailed } = useDemo();
  return <section className="flex flex-col gap-4">
    <h1 className="text-2xl font-extrabold">Pruebas y datos demo</h1><DemoBanner />
    <p className="text-sm text-muted">Cuando no hay locales reales, Hunter muestra cuatro locales y cuatro eventos de ejemplo. Puedes apuntarte, simular un check-in, valorar y simular una compra validada.</p>
    <p className="glass rounded-2xl p-4">Puntos demo: <b>{demoPoints(state)}</b> · Planes demo: <b>{state.plans.length}</b></p>
    <p className="text-xs text-muted">Estos puntos no se suman a los del perfil real. Reiniciar la demo no modifica tu cuenta ni los datos de Supabase.</p>
    {storageFailed && <p role="alert" className="text-sm text-rose">El navegador no permite guardar la demo. Puedes probarla, pero los cambios se perderán al recargar.</p>}
    <button type="button" disabled={!ready} onClick={reset} className="glass min-h-14 rounded-full px-5 font-bold">Reiniciar datos demo</button>
    <Link href="/mapa" className="min-h-11 text-orange-soft underline">Abrir mapa</Link>
    <Link href="/ranking" className="min-h-11 text-orange-soft underline">Probar ranking y premio ficticio</Link>
    <DemoEvents />
  </section>;
}
