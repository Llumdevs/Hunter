import Link from "next/link";
import { Clock, ArrowUpRight } from "lucide-react";
import { PlacePhoto } from "@/components/place-photo";
import { fitPercentage } from "@/lib/tonight/filters";
import type { Score } from "@/lib/tonight/recommend";
import { DEMO_PLACES } from "@/lib/demo/catalog";

export function EventPoster({ event, index, day, month, score, matched }: {
  event: { placeId: string; title: string; time: string; description: string };
  index: number;
  day: string;
  month: string;
  score?: Score;
  matched?: boolean;
}) {
  const place = DEMO_PLACES.find((item) => item.id === event.placeId)!;
  const variants = ["night", "live", "terrace", "electric"] as const;
  return <Link href={`/local/${event.placeId}`} className={`event-poster group relative isolate block overflow-hidden ${score ? "h-[210px] !rounded-[28px]" : "h-[190px]"}`}>
    <PlacePhoto path={null} alt="" demo variant={variants[index % variants.length]} eager={index < 2} className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" />
    <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" />
    {score?.fit !== undefined && score.fit !== null && <span className={`absolute top-4 left-4 rounded-full px-3 py-1.5 text-[10px] font-bold text-night-950 ${matched ? "bg-lime" : "bg-violet-soft"}`}>{fitPercentage(score.fit)}</span>}
    <span className="absolute top-4 right-5 rounded-full bg-black/35 px-2.5 py-1 text-[9px] font-semibold tracking-wide text-white backdrop-blur-md">Demo / {place.zone}</span>
    <div className="absolute right-5 bottom-3 left-3 flex items-center gap-3">
      <time className="event-date flex h-12 w-12 flex-none flex-col items-center justify-center rounded-full bg-violet text-night-950"><b className="text-lg leading-none">{day}</b><span className="mt-0.5 text-[9px] font-extrabold uppercase">{month}</span></time>
      <div className="event-caption min-w-0 flex-1 rounded-full px-3 py-2 text-white"><h3 className="truncate text-sm font-extrabold tracking-tight">{event.title}</h3><p className="mt-0.5 flex items-center gap-1 text-[10px] text-white/80"><Clock aria-hidden className="h-3 w-3" />{event.time} · {place.name.replace(" · Demo", "")}</p></div>
      <ArrowUpRight aria-hidden className="h-4 w-4 flex-none text-white/85" />
    </div>
  </Link>;
}
