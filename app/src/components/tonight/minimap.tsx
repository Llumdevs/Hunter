import Link from "next/link";
import { projectPoints } from "@/lib/tonight/project";

export type MapPin = { id: string; name: string; lat: number; lng: number; tone: "match" | "discover" | "other" };
type Props = { pins: MapPin[]; me: { lat: number; lng: number } | null; width: number; height: number };

const TONE = { match: "fill-lime", discover: "fill-orange", other: "fill-ink-muted" } as const;
const PADDING = 22;

// Mapa esquemático (posiciones reales, sin calles) hasta conectar un proveedor de teselas.
export function Minimap({ pins, me, width, height }: Props) {
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
      {pins.map((pin, i) => (
        <Link key={pin.id} href={`/local/${pin.id}`} aria-label={pin.name}>
          <circle cx={points[i].x} cy={points[i].y} r="13" className={`${TONE[pin.tone]} opacity-20`} />
          <circle cx={points[i].x} cy={points[i].y} r="7" className={`${TONE[pin.tone]} stroke-night-900`} strokeWidth="3" />
        </Link>
      ))}
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
      <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-orange" />Para descubrir</span>
      <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-sky" />Tú</span>
    </div>
  );
}
