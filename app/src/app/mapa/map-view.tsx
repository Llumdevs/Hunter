"use client";

import { LocateFixed, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MapLegend, type MapPin } from "@/components/tonight/minimap";
import { useMyPosition } from "@/components/tonight/use-my-position";
import { labelFor, MUSIC } from "@/lib/tonight/catalog";
import { distanceMeters, formatDistance } from "@/lib/tonight/format";
import { recommend, scorePlace } from "@/lib/tonight/recommend";
import type { TonightData } from "@/lib/tonight/load";
import { fitPercentage } from "@/lib/tonight/filters";
import { StreetMap } from "@/components/tonight/street-map";
import { PlacePhoto } from "@/components/place-photo";
import { VenueResult } from "@/components/tonight/venue-result";
import { isDemoPlace } from "@/lib/demo/catalog";
import { DemoBanner } from "@/components/demo/demo-panels";

export function MapView({ places, weights, preferences, offersByPlace, demoMode, loadError }: TonightData) {
  const [sort, setSort] = useState("fit");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { position, locate, denied, locating } = useMyPosition(true);
  const { all, forYouIds, hasPreferences } = useMemo(() => {
    const { forYou } = recommend(places, preferences, weights);
    const scored = places
      .map((place) => ({ place, score: scorePlace(place, preferences, weights) }))
      .sort((a, b) => (b.score.fit ?? 0) - (a.score.fit ?? 0) || a.place.name.localeCompare(b.place.name, "es"));
    return {
      all: scored,
      forYouIds: new Set(forYou.map((r) => r.place.id)),
      hasPreferences: scored.some((r) => r.score.fit !== null),
    };
  }, [places, preferences, weights]);
  const pins: MapPin[] = useMemo(() => places.map((p) => ({ id: p.id, name: p.name, lat: p.lat, lng: p.lng, tone: !hasPreferences ? "other" : forYouIds.has(p.id) ? "match" : "discover" })), [places, hasPreferences, forYouIds]);
  const ordered = sort === "distance" && position ? [...all].sort((a, b) => distanceMeters(position, a.place) - distanceMeters(position, b.place)) : all;
  const selected = all.find(({ place }) => place.id === selectedId);

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Mapa</h1>
        {!position && (
          <button type="button" onClick={locate} disabled={locating} className="glass flex min-h-11 items-center gap-1 rounded-full px-3 py-2 text-xs font-bold disabled:opacity-50">
            <LocateFixed aria-hidden className="h-4 w-4" />{locating ? "Buscando ubicación…" : "Usar mi ubicación"}
          </button>
        )}
      </header>
      {loadError && <p role="alert" className="text-sm text-rose">{loadError}</p>}
      {denied && <p role="status" className="text-sm text-muted">No tenemos acceso a tu ubicación. Puedes permitirla en los ajustes del navegador o seguir explorando Valencia.</p>}
      <p className="text-sm text-muted">Toca un punto para descubrir el local.</p>
      <div className="relative isolate h-[min(55dvh,430px)] min-h-72 overflow-hidden rounded-[28px] border border-white/10">
        <StreetMap pins={pins} me={position} onSelect={setSelectedId} selectedId={selectedId} />
        {selected && (
          <section aria-label="Local seleccionado" aria-live="polite" className="absolute inset-x-3 bottom-3 z-[600] flex scroll-mb-32 flex-col gap-3 rounded-3xl border border-white/20 bg-night-950 p-4 shadow-xl">
            <div className="flex items-start gap-3">
              <PlacePhoto path={selected.place.cover_path} alt="" demo={isDemoPlace(selected.place.id)} variant={selected.place.music === "jazz" ? "live" : selected.place.music === "indie" ? "terrace" : selected.place.music === "pop" ? "electric" : "night"} className="h-20 w-20 flex-none rounded-2xl" />
              <div className="min-w-0 flex-1"><h2 className="text-base leading-tight font-bold">{selected.place.name}</h2><p className="mt-2 text-xs text-muted">{[selected.place.zone, position && formatDistance(distanceMeters(position, selected.place))].filter(Boolean).join(" · ")}</p><p className="mt-1 text-xs text-muted">{labelFor(MUSIC, selected.place.music)} · {selected.place.price_level}</p>{selected.score.fit !== null && <p className={`mt-2 text-[11px] font-semibold ${forYouIds.has(selected.place.id) ? "text-lime" : "text-violet-soft"}`}>{fitPercentage(selected.score.fit)}</p>}</div>
              <button type="button" aria-label="Cerrar local seleccionado" onClick={() => setSelectedId(null)} className="grid h-9 w-9 flex-none place-items-center rounded-full bg-white/5"><X aria-hidden className="h-4 w-4" /></button>
            </div>
            {offersByPlace[selected.place.id] && <p className="text-sm text-violet-soft">{offersByPlace[selected.place.id]}</p>}
            <Link href={`/local/${selected.place.id}`} className="rounded-full bg-lime p-3 text-center font-bold text-night-950">Ver el local</Link>
          </section>
        )}
      </div>
      <MapLegend />
      <p className="text-[10px] text-muted">Distancias en línea recta desde tu ubicación.</p>
      <section aria-label="Locales del mapa" className="flex flex-col gap-3">
        <header className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">{all.length} locales para explorar</h2><label className="text-[10px] text-muted"><span className="sr-only">Ordenar locales</span><select value={sort} onChange={(event) => setSort(event.target.value)} className="min-h-11 max-w-32 rounded-full border border-white/10 bg-night-950 px-3 text-xs"><option value="fit">{hasPreferences ? "Por encaje" : "Por nombre"}</option><option value="distance" disabled={!position}>Más cerca</option></select></label></header>
        <ul className="flex flex-col gap-2.5">{ordered.map(({ place, score }) => <li key={place.id}><VenueResult place={place} score={score} matched={forYouIds.has(place.id)} me={position} /></li>)}</ul>
      </section>
      {demoMode && <DemoBanner />}
    </section>
  );
}
