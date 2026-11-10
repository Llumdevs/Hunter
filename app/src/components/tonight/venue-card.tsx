import { Heart, MapPin } from "lucide-react";
import Link from "next/link";
import { PlacePhoto } from "@/components/place-photo";
import { labelFor, MUSIC } from "@/lib/tonight/catalog";
import { crowdLabel, distanceMeters, formatDistance } from "@/lib/tonight/format";
import { matchReason, type Score } from "@/lib/tonight/recommend";
import type { TonightPlaceRow } from "@/lib/tonight/load";
import { fitPercentage } from "@/lib/tonight/filters";

type Props = { place: TonightPlaceRow; score: Score; me: { lat: number; lng: number } | null; matched: boolean };

function placeMeta(place: TonightPlaceRow, me: Props["me"]) {
  const distance = me ? formatDistance(distanceMeters(me, place)) : null;
  return [place.zone, distance, labelFor(MUSIC, place.music)].filter(Boolean).join(" · ");
}

export function VenueCard({ place, score, me, matched }: Props) {
  const crowd = crowdLabel(place.signups_visible, place.signups_any);
  return (
    <Link href={`/local/${place.id}`} className="glass flex w-64 flex-none flex-col gap-2 rounded-[var(--radius-card)] p-2.5">
      <div className="relative">
        <PlacePhoto path={place.cover_path} alt={place.name} className="h-28 rounded-[20px]" />
        {score.fit !== null && <span className={`absolute top-2 left-2 rounded-full px-2.5 py-1 text-xs font-bold text-night-950 ${matched ? "bg-lime" : "bg-orange-soft"}`}>{fitPercentage(score.fit)}</span>}
        <span aria-hidden className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-black/35"><Heart className="h-4 w-4" /></span>
      </div>
      <div className="flex items-center gap-2 px-1">
        <h3 className="text-base font-bold">{place.name}</h3>
        <span className="ml-auto rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold">{place.price_level}</span>
      </div>
      <p className="flex items-center gap-1 px-1 text-xs text-muted"><MapPin aria-hidden className="h-3.5 w-3.5" />{placeMeta(place, me)}</p>
      <p className={`px-1 text-xs ${matched ? "text-lime" : "text-orange-soft"}`}>{matchReason(score)}</p>
      <p className="px-1 pb-1 text-xs text-muted">
        {[place.age_band && `Mayoría ${place.age_band}`, crowd].filter(Boolean).join(" · ")}
      </p>
    </Link>
  );
}
