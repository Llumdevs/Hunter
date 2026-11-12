"use client";

import { ArrowUpRight, AudioLines, Disc3, Mic2, MessageCircle, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Minimap, type MapPin } from "@/components/tonight/minimap";
import { useMyPosition } from "@/components/tonight/use-my-position";
import { VenueCard } from "@/components/tonight/venue-card";
import { recommend, scorePlace } from "@/lib/tonight/recommend";
import type { TonightData } from "@/lib/tonight/load";
import { EMPTY_FILTERS, filterPlaces, type TonightFilters } from "@/lib/tonight/filters";
import { MUSIC, VIBES, PRICES, labelFor } from "@/lib/tonight/catalog";
import { DEMO_EVENTS } from "@/lib/demo/catalog";
import { DemoBanner, DemoEvents } from "@/components/demo/demo-panels";

type Props = TonightData & { displayName: string };

export function TonightView({ places, weights, preferences, displayName, demoMode, loadError }: Props) {
  const { position, denied } = useMyPosition();
  const [filters, setFilters] = useState<TonightFilters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState("");
  const visiblePlaces = useMemo(() => {
    const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const needle = normalize(query.trim());
    return filterPlaces(places, filters).filter((place) => normalize(`${place.name} ${place.zone} ${labelFor(MUSIC, place.music) ?? ""} ${DEMO_EVENTS.find((event) => event.placeId === place.id)?.title ?? ""}`).includes(needle));
  }, [places, filters, query]);
  const { forYou, alsoLike } = useMemo(() => recommend(visiblePlaces, preferences, weights), [visiblePlaces, preferences, weights]);
  const hasPreferences = forYou.some((r) => r.score.fit !== null) || alsoLike.length > 0;
  const rankedDemo = useMemo(() => visiblePlaces.map((place) => ({ place, score: scorePlace(place, preferences, weights), matched: forYou.some((item) => item.place.id === place.id) })).sort((a, b) => (b.score.fit ?? 0) - (a.score.fit ?? 0)), [visiblePlaces, preferences, weights, forYou]);
  const forYouIds = new Set(forYou.map((r) => r.place.id));
  const pins: MapPin[] = visiblePlaces.map((p) => ({
    id: p.id, name: p.name, lat: p.lat, lng: p.lng,
    tone: !hasPreferences ? "other" : forYouIds.has(p.id) ? "match" : "discover",
  }));

  return (
    <section aria-label={`Planes para ${displayName}`} className="flex flex-col gap-4">
      <label className="search-line flex h-12 items-center gap-3 border-b border-white/10 px-1"><Search aria-hidden className="h-4 w-4 flex-none text-muted" /><input type="search" aria-label="Buscar un evento o local" placeholder="Busca un evento, local o barrio" value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted/70" /></label>
      <div aria-label="Explorar por ambiente" className="horizontal-carousel -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">{[{ label: "Todo", vibe: "", Icon: AudioLines }, { label: "Para bailar", vibe: "bailar", Icon: Disc3 }, { label: "En directo", vibe: "directo", Icon: Mic2 }, { label: "Para hablar", vibe: "hablar", Icon: MessageCircle }].map(({ label, vibe, Icon }) => <button key={label} type="button" aria-pressed={filters.vibe === vibe} onClick={() => setFilters({ ...filters, vibe })} className={`flex min-h-11 flex-none items-center gap-2 rounded-xl px-3 text-xs font-semibold ${filters.vibe === vibe ? "bg-white/15 text-white" : "bg-white/[.04] text-muted"}`}><Icon aria-hidden className={`h-4 w-4 ${filters.vibe === vibe ? "text-violet" : ""}`} />{label}</button>)}</div>
      <header className="flex items-center justify-between gap-3"><div><h1 className="text-2xl font-extrabold">Esta noche</h1><p className="mt-1 text-xs text-muted">Un plan que encaje contigo.</p></div><button type="button" aria-label="Filtrar esta noche" aria-expanded={filtersOpen} aria-controls="tonight-filters" onClick={() => setFiltersOpen(!filtersOpen)} className={`relative grid h-11 w-11 place-items-center rounded-full ${filtersOpen || Object.values(filters).some(Boolean) ? "bg-violet/15 text-violet-soft" : "bg-white/5"}`}><SlidersHorizontal aria-hidden className="h-4 w-4" /></button></header>
      {loadError && <p role="alert" className="text-sm text-rose">{loadError}</p>}


      {filtersOpen && <div id="tonight-filters" className="rounded-3xl border border-white/10 bg-white/[.03] p-4">
        <div className="grid grid-cols-2 gap-3">
          {([{ key: "music", label: "Música esta noche", visibleLabel: "Música", options: MUSIC }, { key: "vibe", label: "Ambiente esta noche", visibleLabel: "Ambiente", options: VIBES }, { key: "price", label: "Presupuesto esta noche", visibleLabel: "Presupuesto", options: PRICES }] as const).map(({ key, label, visibleLabel, options }) => (
            <label key={key} className={`flex flex-col gap-1 text-[11px] font-semibold text-muted ${key === "price" ? "col-span-2" : ""}`}>
              {visibleLabel}
              <select aria-label={label} value={filters[key]} onChange={(event) => setFilters({ ...filters, [key]: event.target.value })} className="min-h-11 min-w-0 rounded-xl border border-white/15 bg-night-900 px-3 text-xs font-normal text-fg"><option value="">Todos</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
            </label>
          ))}
          <p className="col-span-2 text-[10px] text-muted">Solo para esta visita. Tus gustos guardados no cambian.</p>
          <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="min-h-11 rounded-full border border-white/15 text-xs font-semibold text-violet-soft">Quitar filtros</button>
          <button type="button" onClick={() => setFiltersOpen(false)} className="min-h-11 rounded-full bg-lime px-4 text-xs font-bold text-night-950">Ver resultados</button>
        </div>
      </div>}
      {demoMode && <DemoEvents hideHeading ranked={rankedDemo} me={position} />}
      {visiblePlaces.length === 0 ? (
        <p className="glass rounded-[var(--radius-card)] p-5 text-muted">{places.length === 0 ? "Esta noche no hay locales abiertos en Hunter todavía." : "No hay locales que coincidan con estos filtros. Prueba a quitar alguno."}</p>
      ) : (
        <>
          {!hasPreferences && (
            <Link href="/perfil/gustos" className="rounded-2xl border border-dashed border-violet/60 p-4 text-sm">
              <b className="text-violet-soft">Dinos qué te gusta</b> y te diremos qué sitios encajan contigo esta noche.
            </Link>
          )}

          {!demoMode && forYou.length > 0 && <Section title={hasPreferences ? "Para ti" : "Abiertos esta noche"}>
            {forYou.map(({ place, score }) => (
              <VenueCard key={place.id} place={place} score={score} me={position} matched={hasPreferences} />
            ))}
          </Section>}

          {!demoMode && alsoLike.length > 0 && (
            <Section title={forYou.length ? "También te puede gustar" : "Para descubrir"}>
              {alsoLike.map(({ place, score }) => (
                <VenueCard key={place.id} place={place} score={score} me={position} matched={false} />
              ))}
            </Section>
          )}
          {demoMode && <DemoBanner />}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[.025]">
            <Link href="/mapa" aria-label="Abrir mapa de esta noche" className="flex h-28 items-center justify-between gap-3 px-4"><div className="flex flex-col gap-1"><h2 className="text-base font-bold">Explora Valencia</h2><p className="text-xs text-muted">Encuentra tu próximo sitio en el mapa.</p><span className="mt-2 flex items-center gap-1 text-xs font-semibold text-violet-soft">Ver mapa<ArrowUpRight aria-hidden className="h-3.5 w-3.5" /></span></div><div className="h-24 w-28 flex-none opacity-75"><Minimap pins={pins} me={position} width={112} height={96} interactive={false} /></div></Link>
          </div>
          {denied && <p className="text-xs text-muted">Sin ubicación no podemos mostrar distancias. Puedes seguir igualmente.</p>}
        </>
      )}
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const id = `section-${title.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex items-center justify-between"><h2 id={id} className="text-xl font-extrabold">{title}</h2><ArrowUpRight aria-hidden className="h-5 w-5 text-lime" /></div>
      <div role="group" aria-label={`Locales de ${title}`} tabIndex={0} className="horizontal-carousel -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">{children}</div>
    </section>
  );
}
