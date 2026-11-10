"use client";

import { LocateFixed, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MapLegend, Minimap, type MapPin } from "@/components/tonight/minimap";
import { useMyPosition } from "@/components/tonight/use-my-position";
import { VenueCard } from "@/components/tonight/venue-card";
import { HunterLogo } from "@/components/logo";
import { recommend } from "@/lib/tonight/recommend";
import type { TonightData } from "@/lib/tonight/load";
import { EMPTY_FILTERS, filterPlaces, type TonightFilters } from "@/lib/tonight/filters";
import { MUSIC, VIBES, PRICES } from "@/lib/tonight/catalog";

type Props = TonightData & { displayName: string };

export function TonightView({ places, weights, preferences, displayName }: Props) {
  const { position, denied, locate } = useMyPosition();
  const [filters, setFilters] = useState<TonightFilters>(EMPTY_FILTERS);
  const visiblePlaces = useMemo(() => filterPlaces(places, filters), [places, filters]);
  const { forYou, alsoLike } = useMemo(() => recommend(visiblePlaces, preferences, weights), [visiblePlaces, preferences, weights]);
  const hasPreferences = forYou.some((r) => r.score.fit !== null) || alsoLike.length > 0;
  const forYouIds = new Set(forYou.map((r) => r.place.id));
  const pins: MapPin[] = visiblePlaces.map((p) => ({
    id: p.id, name: p.name, lat: p.lat, lng: p.lng,
    tone: !hasPreferences ? "other" : forYouIds.has(p.id) ? "match" : "discover",
  }));

  return (
    <section className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <div>
          <HunterLogo className="h-6 text-fg" />
          <p className="mt-1 text-sm text-muted">Hola, {displayName}</p>
        </div>
        <Link href="/perfil/gustos" aria-label="Editar mis gustos" className="glass grid h-11 w-11 place-items-center rounded-full">
          <SlidersHorizontal aria-hidden className="h-5 w-5" />
        </Link>
      </header>

      <h1 className="text-[28px] leading-[1.05] font-extrabold uppercase">Esta noche<br /><span className="text-muted">en Valencia</span></h1>
      <details className="glass rounded-2xl p-4">
        <summary className="cursor-pointer font-bold">Filtrar esta noche{Object.values(filters).some(Boolean) ? ` (${Object.values(filters).filter(Boolean).length})` : ""}</summary>
        <div className="mt-4 flex flex-col gap-3">
          {([{ key: "music", label: "Música esta noche", options: MUSIC }, { key: "vibe", label: "Ambiente esta noche", options: VIBES }, { key: "price", label: "Presupuesto esta noche", options: PRICES }] as const).map(({ key, label, options }) => (
            <label key={key} className="flex flex-col gap-1 text-sm">
              {label}
              <select value={filters[key]} onChange={(event) => setFilters({ ...filters, [key]: event.target.value })} className="rounded-xl border border-white/20 bg-night-900 p-3">
                <option value="">Todos</option>
                {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          ))}
          <p className="text-xs text-muted">Solo para esta visita. Tus gustos guardados no cambian.</p>
          <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="text-sm text-orange-soft underline">Quitar filtros</button>
        </div>
      </details>

      {visiblePlaces.length === 0 ? (
        <p className="glass rounded-[var(--radius-card)] p-5 text-muted">{places.length === 0 ? "Esta noche no hay locales abiertos en Hunter todavía." : "No hay locales que coincidan con estos filtros. Prueba a quitar alguno."}</p>
      ) : (
        <>
          <div className="glass relative h-40 overflow-hidden rounded-[22px]">
            <Minimap pins={pins} me={position} width={360} height={160} />
            <Link href="/mapa" className="absolute right-2.5 bottom-2.5 rounded-full border border-white/15 bg-night-950/75 px-3 py-1.5 text-xs font-bold">Ver mapa</Link>
            {!position && (
              <button type="button" onClick={locate}
                className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full border border-white/15 bg-night-950/75 px-3 py-1.5 text-xs font-bold">
                <LocateFixed aria-hidden className="h-3.5 w-3.5" />Usar mi ubicación
              </button>
            )}
          </div>
          <MapLegend />
          {denied && <p className="text-xs text-muted">Sin ubicación no podemos mostrar distancias. Puedes seguir igualmente.</p>}

          {!hasPreferences && (
            <Link href="/perfil/gustos" className="rounded-2xl border border-dashed border-orange/60 p-4 text-sm">
              <b className="text-orange-soft">Dinos qué te gusta</b> y te diremos qué sitios encajan contigo esta noche.
            </Link>
          )}

          <Section title={hasPreferences ? "Para ti" : "Abiertos esta noche"}>
            {forYou.map(({ place, score }) => (
              <VenueCard key={place.id} place={place} score={score} me={position} matched={hasPreferences} />
            ))}
            {forYou.length === 0 && <p className="text-sm text-muted">Nada encaja del todo esta noche. Mira estas propuestas:</p>}
          </Section>

          {alsoLike.length > 0 && (
            <Section title="También te puede gustar">
              {alsoLike.map(({ place, score }) => (
                <VenueCard key={place.id} place={place} score={score} me={position} matched={false} />
              ))}
            </Section>
          )}
        </>
      )}
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const id = `section-${title.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-lg font-bold">{title}</h2>
      <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">{children}</div>
    </section>
  );
}
