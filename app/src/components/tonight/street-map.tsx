"use client";

import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { Minimap, type MapPin } from "./minimap";

type Props = { pins: MapPin[]; me: { lat: number; lng: number } | null; selectedId: string | null; onSelect: (id: string) => void; onPickPosition?: (lat: number, lng: number) => void };
const COLORS = { match: "#c6f432", discover: "#ff925b", other: "#b1abc5" };

export function StreetMap({ pins, me, selectedId, onSelect, onPickPosition }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const library = useRef<typeof Leaflet | null>(null);
  const markers = useRef<Leaflet.LayerGroup | null>(null);
  const fitted = useRef("");
  const [ready, setReady] = useState(false);
  const [tilesFailed, setTilesFailed] = useState(false);
  const [schematic, setSchematic] = useState(false);

  useEffect(() => {
    if (schematic) return;
    let canceled = false;
    let observer: ResizeObserver | undefined;
    import("leaflet").then((L) => {
      if (canceled || !container.current) return;
      library.current = L;
      // Leaflet 1.9 deja un temporizador de zoom vivo al desmontarse durante una
      // navegación. El zoom inmediato evita que intente usar un mapa ya eliminado.
      const instance = L.map(container.current, { zoomControl: false, scrollWheelZoom: true, zoomAnimation: false }).setView([39.47, -0.376], 13);
      L.control.zoom({ zoomInTitle: "Acercar", zoomOutTitle: "Alejar" }).addTo(instance);
      map.current = instance;
      markers.current = L.layerGroup().addTo(instance);
      let failures = 0;
      let loaded = 0;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).on("tileload", () => { loaded++; setTilesFailed(false); })
        .on("tileerror", () => { if (++failures >= 3 && loaded === 0) setTilesFailed(true); }).addTo(instance);
      observer = new ResizeObserver(() => { if (!canceled && map.current === instance) instance.invalidateSize({ animate: false }); });
      observer.observe(container.current);
      setReady(true);
    }).catch(() => { if (!canceled) setTilesFailed(true); });
    return () => {
      canceled = true; observer?.disconnect(); map.current?.remove(); map.current = null; fitted.current = "";
    };
  }, [schematic]);

  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance || !onPickPosition) return;
    const pick = (event: Leaflet.LeafletMouseEvent) => onPickPosition(event.latlng.lat, event.latlng.lng);
    instance.on("click", pick);
    return () => { instance.off("click", pick); };
  }, [ready, onPickPosition]);

  useEffect(() => {
    const instance = map.current;
    const L = library.current;
    const layer = markers.current;
    if (!ready || !instance || !L || !layer || schematic) return;
    layer.clearLayers();
    for (const pin of pins) {
      const color = COLORS[pin.tone];
      const selected = selectedId === pin.id;
      const icon = L.divIcon({ className: "hunter-map-pin", iconSize: [36, 36], iconAnchor: [18, 18], html: `<span style="display:block;width:28px;height:28px;margin:4px;border-radius:50%;background:${color};border:3px solid ${selected ? "white" : "#170d24"};box-shadow:0 2px 8px #0008;${selected ? "transform:scale(1.2)" : ""}"></span>` });
      const marker = L.marker([pin.lat, pin.lng], { icon, title: pin.name, keyboard: true, zIndexOffset: selected ? 1000 : 0 }).addTo(layer);
      marker.on("click", () => onSelect(pin.id));
      marker.getElement()?.setAttribute("aria-label", pin.name);
      marker.getElement()?.setAttribute("aria-pressed", String(selected));
      marker.getElement()?.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); onSelect(pin.id); }
      });
      const text = document.createElement("span"); text.textContent = pin.name;
      marker.bindTooltip(text);
    }
    if (me) L.circleMarker([me.lat, me.lng], { radius: 8, fillColor: "#9fe7f5", color: "#170d24", weight: 3, fillOpacity: 1 }).bindTooltip("Tu ubicación").addTo(layer);
    // Encajar solo los locales: una ubicación lejana no debe comprimirlos en un punto.
    const key = JSON.stringify(pins.map((pin) => [pin.id, pin.lat, pin.lng]));
    if (key !== fitted.current && pins.length > 0) {
      instance.fitBounds(L.latLngBounds(pins.map((pin) => [pin.lat, pin.lng] as [number, number])), { padding: [35, 35], maxZoom: 15, animate: false });
      fitted.current = key;
    }
  }, [ready, pins, selectedId, me, onSelect, schematic]);

  return <>
    {schematic ? <Minimap pins={pins} me={null} width={360} height={450} onSelect={onSelect} selectedId={selectedId} /> : <div ref={container} role="region" aria-label="Mapa interactivo de locales" className="absolute inset-0 z-0 isolate" />}
    {!schematic && ready && <div className="absolute top-3 right-3 z-[500] flex flex-col items-end gap-2 text-xs">
      {me && <button type="button" onClick={() => map.current?.setView([me.lat, me.lng], 15)} className="min-h-10 rounded-full border border-white/20 bg-night-950 px-3 text-fg">Centrar en mi ubicación</button>}
      <button type="button" onClick={() => { if (pins.length && library.current) map.current?.fitBounds(library.current.latLngBounds(pins.map((pin) => [pin.lat, pin.lng] as [number, number])), { padding: [35, 35], maxZoom: 15 }); }} className="min-h-10 rounded-full border border-white/20 bg-night-950 px-3 text-fg">Ver todos los locales</button>
    </div>}
    {tilesFailed && !schematic && <div role="status" className="absolute inset-x-3 top-20 z-[500] rounded-2xl border border-white/20 bg-night-950 p-3 text-xs text-fg">
      <p>No se ha podido cargar el callejero. Puedes seguir usando la lista de locales o el mapa sin calles.</p>
      <button type="button" onClick={() => setSchematic(true)} className="mt-2 min-h-10 font-bold text-orange-soft underline">Ver mapa sin calles</button>
    </div>}
  </>;
}
