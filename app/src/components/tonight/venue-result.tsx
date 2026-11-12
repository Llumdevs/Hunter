import Link from "next/link";
import { ArrowUpRight, Clock, MapPin } from "lucide-react";
import { PlacePhoto } from "@/components/place-photo";
import { isDemoPlace } from "@/lib/demo/catalog";
import { labelFor, MUSIC } from "@/lib/tonight/catalog";
import { distanceMeters, formatDistance } from "@/lib/tonight/format";
import { fitPercentage } from "@/lib/tonight/filters";
import type { TonightPlaceRow } from "@/lib/tonight/load";
import type { Score } from "@/lib/tonight/recommend";

export function VenueResult({ place, score, matched, me, event }: {
  place: TonightPlaceRow;
  score: Score;
  matched: boolean;
  me: { lat: number; lng: number } | null;
  event?: { title: string; time: string };
}) {
  const distance = me ? formatDistance(distanceMeters(me, place)) : null;
  const variant = place.music === "jazz" ? "live" : place.music === "indie" ? "terrace" : place.music === "pop" ? "electric" : "night";
  return <Link href={`/local/${place.id}`} className="venue-result group grid grid-cols-[76px_minmax(0,1fr)_auto] items-center gap-3 rounded-3xl border border-white/[.07] bg-white/[.025] p-2.5 transition-colors hover:bg-white/[.06]">
    <PlacePhoto path={place.cover_path} alt="" demo={isDemoPlace(place.id)} variant={variant} className="h-[86px] rounded-[18px]" />
    <div className="min-w-0"><h3 className="text-sm leading-snug font-bold tracking-[-.02em]">{event?.title ?? place.name.replace(" · Demo", "")}</h3><p className="mt-1 truncate text-[11px] text-muted">{place.zone} · {labelFor(MUSIC, place.music)}</p><div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold">{score.fit !== null && <span className={matched ? "text-lime" : "text-violet-soft"}>{fitPercentage(score.fit)}</span>}{event ? <span className="flex items-center gap-1 text-muted"><Clock aria-hidden className="h-3 w-3" />{event.time}</span> : distance ? <span className="flex items-center gap-1 text-muted"><MapPin aria-hidden className="h-3 w-3" />{distance}</span> : null}{isDemoPlace(place.id) && <span className="text-muted/70">Demo</span>}</div></div>
    <div className="flex h-full flex-col items-end justify-between py-1 text-muted"><span className="text-[11px] font-semibold">{event && distance ? distance : place.price_level}</span><ArrowUpRight aria-hidden className="h-4 w-4" /></div>
  </Link>;
}
