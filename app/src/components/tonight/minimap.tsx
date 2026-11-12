import Link from "next/link";
import { projectPoints } from "@/lib/tonight/project";

export type MapPin = { id: string; name: string; lat: number; lng: number; tone: "match" | "discover" | "other" };
type Props = { pins: MapPin[]; me: { lat: number; lng: number } | null; width: number; height: number; onSelect?: (id: string) => void; selectedId?: string | null; interactive?: boolean };

const TONE = { match: "fill-lime", discover: "fill-violet", other: "fill-ink-muted" } as const;
const PADDING = 22;

// Mapa esquemático (posiciones reales, sin calles) hasta conectar un proveedor de teselas.
export function Minimap({ pins, me, width, height, onSelect, selectedId, interactive = true }: Props) {
  const points = projectPoints([...pins, ...(me ? [me] : [])], { width, height, padding: PADDING });
  const mePoint = me ? points[points.length - 1] : null;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="group" aria-label="Mapa de los locales de esta noche">
      <defs>
        <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M28 0H0V28" fill="none" stroke="rgb(255 255 255 / 0.05)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#grid)" />
      {pins.map((pin, i) => {
        const circles = <>
          <circle cx={points[i].x} cy={points[i].y} r="13" className={`${TONE[pin.tone]} opacity-20`} />
          <circle cx={points[i].x} cy={points[i].y} r={selectedId === pin.id ? "10" : "7"} className={`${TONE[pin.tone]} ${selectedId === pin.id ? "stroke-white" : "stroke-night-900"}`} strokeWidth="3" />
        </>;
        return !interactive ? <g key={pin.id}>{circles}</g> : onSelect ? (
          <g key={pin.id} role="button" tabIndex={0} aria-label={pin.name} aria-pressed={selectedId === pin.id}
            className="cursor-pointer outline-violet" onClick={() => onSelect(pin.id)}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(pin.id); } }}>
            {circles}
          </g>
        ) : <Link key={pin.id} href={`/local/${pin.id}`} aria-label={pin.name}>{circles}</Link>;
      })}
      {mePoint && (
        <g aria-label="Tu posición">
          <circle cx={mePoint.x} cy={mePoint.y} r="16" className="fill-sky opacity-20" />
          <circle cx={mePoint.x} cy={mePoint.y} r="7" className="fill-sky stroke-night-900" strokeWidth="3" />
        </g>
      )}
    </svg>
  );
}

export function MapLegend() {
  return (
    <div className="flex gap-4 text-[11px] text-muted">
      <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-lime" />Encaja contigo</span>
      <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-violet" />Para descubrir</span>
      <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-sky" />Tú</span>
    </div>
  );
}
