"use client";

import { LocateFixed } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MapLegend, Minimap, type MapPin } from "@/components/tonight/minimap";
import { useMyPosition } from "@/components/tonight/use-my-position";
import { labelFor, MUSIC } from "@/lib/tonight/catalog";
import { distanceMeters, formatDistance } from "@/lib/tonight/format";
import { matchReason, recommend, scorePlace } from "@/lib/tonight/recommend";
import type { TonightData } from "@/lib/tonight/load";
import { fitPercentage } from "@/lib/tonight/filters";

export function MapView({ places, weights, preferences, offersByPlace }: TonightData) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { position, locate } = useMyPosition();
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
  const tone = (id: string): MapPin["tone"] => (!hasPreferences ? "other" : forYouIds.has(id) ? "match" : "discover");
  const pins: MapPin[] = places.map((p) => ({ id: p.id, name: p.name, lat: p.lat, lng: p.lng, tone: tone(p.id) }));
  const TONE_DOT = { match: "bg-lime", discover: "bg-orange", other: "bg-ink-muted" } as const;
  const selected = all.find(({ place }) => place.id === selectedId);

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold uppercase">Mapa</h1>
        {!position && (
          <button type="button" onClick={locate} className="glass flex items-center gap-1 rounded-full px-3 py-2 text-xs font-bold">
            <LocateFixed aria-hidden className="h-4 w-4" />Usar mi ubicación
          </button>
        )}
      </header>
      <p className="text-sm text-muted">Toca un punto para descubrir el local.</p>
      <div className="glass relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)]">
        <Minimap pins={pins} me={position} width={360} height={450} onSelect={setSelectedId} selectedId={selectedId} />
        {selected && (
          <section aria-label="Local seleccionado" aria-live="polite" className="absolute inset-x-3 bottom-3 flex flex-col gap-3 rounded-3xl border border-white/20 bg-night-950 p-4 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">{selected.place.name}</h2>
              <button type="button" aria-label="Cerrar local seleccionado" onClick={() => setSelectedId(null)} className="grid h-10 w-10 place-items-center rounded-full border border-white/20">×</button>
            </div>
            <p className="text-sm text-muted">{[selected.place.zone, position && formatDistance(distanceMeters(position, selected.place)), labelFor(MUSIC, selected.place.music), selected.place.price_level].filter(Boolean).join(" · ")}</p>
            {selected.score.fit !== null && <p className="text-sm font-bold text-lime">{fitPercentage(selected.score.fit)}</p>}
            {offersByPlace[selected.place.id] && <p className="text-sm text-orange-soft">{offersByPlace[selected.place.id]}</p>}
            <Link href={`/local/${selected.place.id}`} className="rounded-full bg-lime p-3 text-center font-bold text-night-950">Ver el local</Link>
          </section>
        )}
      </div>
      <MapLegend />
      <p className="text-xs text-muted">Mapa esquemático: posiciones reales, sin calles.</p>
      <ul className="flex flex-col gap-2">
        {all.map(({ place, score }) => (
          <li key={place.id}>
            <Link href={`/local/${place.id}`} className="glass flex items-center gap-3 rounded-2xl p-3">
              <span className={`h-3 w-3 flex-none rounded-full ${TONE_DOT[tone(place.id)]}`} />
              <span className="flex-1">
                <b className="block">{place.name}</b>
                <span className="text-xs text-muted">
                  {[place.zone, labelFor(MUSIC, place.music), position && formatDistance(distanceMeters(position, place))].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className="max-w-28 text-right text-[11px] text-muted">{hasPreferences ? matchReason(score) : ""}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
