import { ArrowUpRight, MapPin } from "lucide-react";
import Link from "next/link";
import { PlacePhoto } from "@/components/place-photo";
import { labelFor, MUSIC } from "@/lib/tonight/catalog";
import { crowdLabel, distanceMeters, formatDistance } from "@/lib/tonight/format";
import { matchReason, type Score } from "@/lib/tonight/recommend";
import type { TonightPlaceRow } from "@/lib/tonight/load";
import { isDemoPlace } from "@/lib/demo/catalog";
import { fitPercentage } from "@/lib/tonight/filters";

type Props = { place: TonightPlaceRow; score: Score; me: { lat: number; lng: number } | null; matched: boolean };

function placeMeta(place: TonightPlaceRow, me: Props["me"]) {
  const distance = me ? formatDistance(distanceMeters(me, place)) : null;
  return [place.zone, distance, labelFor(MUSIC, place.music)].filter(Boolean).join(" · ");
}

export function VenueCard({ place, score, me, matched }: Props) {
  const crowd = crowdLabel(place.signups_visible, place.signups_any);
  return (
    <Link href={`/local/${place.id}`} className="venue-poster relative flex min-h-[340px] w-[82%] max-w-80 flex-none snap-start flex-col justify-end overflow-hidden border border-white/15 p-4">
      <PlacePhoto path={place.cover_path} alt={place.name} demo={isDemoPlace(place.id)} variant={place.music === "jazz" || place.music === "indie" ? "live" : "night"} className="poster-photo absolute inset-0" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
      <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
        {score.fit !== null ? <span className={`rounded-full px-3 py-2 text-[11px] font-extrabold text-night-950 ${matched ? "bg-lime" : "bg-orange-soft"}`}>{fitPercentage(score.fit)}</span> : <span className="night-label">Esta noche</span>}
        <span aria-hidden className="glass grid h-10 w-10 place-items-center rounded-full text-white"><ArrowUpRight className="h-5 w-5" /></span>
      </div>
      <div className="relative flex flex-col gap-2">
        <div className="mb-1 flex items-center gap-2"><span className="rounded-full border border-white/25 bg-black/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">{labelFor(MUSIC, place.music)}</span><span className="ml-auto text-sm font-bold text-lime">{place.price_level}</span></div>
        <h3 className="max-w-60 text-[26px] leading-[1.05] font-extrabold tracking-tight text-white">{place.name}</h3>
        <p className="flex items-center gap-1 text-xs text-white/75"><MapPin aria-hidden className="h-3.5 w-3.5 flex-none" />{placeMeta(place, me)}</p>
        <p className={`mt-1 border-t border-white/15 pt-3 text-xs leading-relaxed ${matched ? "text-lime" : "text-orange-soft"}`}>{matchReason(score)}</p>
        {(place.age_band || crowd) && <p className="text-xs text-white/65">{[place.age_band && `Mayoría ${place.age_band}`, crowd].filter(Boolean).join(" · ")}</p>}
      </div>
    </Link>
  );
}
